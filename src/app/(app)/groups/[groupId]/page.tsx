"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Calendar,
  Settings,
  Users,
  Shield,
  Lock,
  Crown,
  Plus,
  Trash2,
  UserPlus,
  LogOut,
  Edit2,
  Webhook,
  BellRing,
  FileText,
  CheckCircle2,
  XCircle,
  Ban,
  UserCheck,
  ArrowRightLeft,
} from "lucide-react";
import { groupsApi, invitesApi } from "@/lib/api/groups";
import { schedulesApi, type ScheduleCreatePayload } from "@/lib/api/schedules";
import { useAuth } from "@/contexts/auth-context";
import { useToast } from "@/components/ui/toast";
import { extractApiError } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { FormField } from "@/components/ui/form-field";
import { PageLoader } from "@/components/ui/spinner";
import { GroupForm } from "@/components/groups/group-form";
import { ScheduleCard } from "@/components/schedules/schedule-card";
import { ScheduleForm } from "@/components/schedules/schedule-form";
import { formatDate, getInitials } from "@/lib/utils";
import { cn } from "@/lib/utils";
import type {
  MyPermissions,
  PendingInvite,
  Schedule,
  GroupRole,
  RolePermission,
  GroupWebhook,
  WebhookType,
} from "@/types";

type Tab = "schedules" | "members" | "roles" | "settings";

const TAG_COLORS = [
  "#EF4444",
  "#F97316",
  "#EAB308",
  "#22C55E",
  "#06B6D4",
  "#3B82F6",
  "#8B5CF6",
  "#EC4899",
  "#6B7280",
];

export default function GroupDetailPage({
  params,
}: {
  params: { groupId: string };
}) {
  const { groupId } = params;
  const { user } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const qc = useQueryClient();
  const [activeTab, setActiveTab] = useState<Tab>("schedules");

  const { data: group, isLoading: groupLoading } = useQuery({
    queryKey: ["group", groupId],
    queryFn: () => groupsApi.get(groupId),
  });
  const { data: perms } = useQuery({
    queryKey: ["my-permissions", groupId],
    queryFn: () => groupsApi.myPermissions(groupId),
    enabled: !!group,
  });

  if (groupLoading) return <PageLoader />;
  if (!group || !perms)
    return (
      <div className="p-6 text-sm text-zinc-500">
        グループが見つかりません。
      </div>
    );

  const isOwner = perms.is_owner;
  const isMember = perms.is_member;

  const tabs: { id: Tab; label: string; icon: React.ElementType }[] = [
    { id: "schedules", label: "スケジュール", icon: Calendar },
    { id: "members", label: "メンバー", icon: Users },
    { id: "roles", label: "ロール", icon: Shield },
    { id: "settings", label: "設定", icon: Settings },
  ];

  return (
    <div className="flex flex-col h-full">
      {/* Group header */}
      <div className="border-b border-zinc-200 bg-white px-6 py-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl font-bold text-zinc-900 truncate">
                {group.name}
              </h1>
              {group.is_private && (
                <Badge variant="private" className="flex items-center gap-1">
                  <Lock className="h-2.5 w-2.5" /> 非公開
                </Badge>
              )}
              {isOwner && (
                <Badge variant="warning" className="flex items-center gap-1">
                  <Crown className="h-2.5 w-2.5" /> オーナー
                </Badge>
              )}
            </div>
            {group.description && (
              <p className="mt-1 text-sm text-zinc-500 max-w-2xl">
                {group.description}
              </p>
            )}
            <p className="mt-1 text-xs text-zinc-400">
              {group.member_count}
              {group.max_members ? ` / ${group.max_members}` : ""} メンバー ·
              作成日: {formatDate(group.created_at)}
            </p>
          </div>

          {!isMember && (
            <JoinGroupButton groupId={groupId} isPrivate={group.is_private} />
          )}
        </div>

        {/* Tabs */}
        <div className="mt-4 flex gap-0 border-b border-zinc-100 -mb-px overflow-x-auto">
          {tabs.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={cn(
                "flex items-center gap-2 whitespace-nowrap border-b-2 px-4 py-2.5 text-sm font-medium transition-colors",
                activeTab === id
                  ? "border-brand-600 text-brand-700"
                  : "border-transparent text-zinc-500 hover:text-zinc-900",
              )}
            >
              <Icon className="h-4 w-4" />
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-y-auto p-6">
        {activeTab === "schedules" && (
          <SchedulesTab
            groupId={groupId}
            perms={perms}
            currentUserId={user?.id ?? ""}
          />
        )}
        {activeTab === "members" && (
          <MembersTab
            groupId={groupId}
            perms={perms}
            ownerId={group.owner.id}
            currentUserId={user?.id ?? ""}
          />
        )}
        {activeTab === "roles" && <RolesTab groupId={groupId} perms={perms} />}
        {activeTab === "settings" && (
          <SettingsTab
            group={group}
            perms={perms}
            isOwner={isOwner}
            isMember={isMember}
          />
        )}
      </div>
    </div>
  );
}

// ── Schedules Tab ──────────────────────────────────────────────────────────────

function SchedulesTab({
  groupId,
  perms,
  currentUserId,
}: {
  groupId: string;
  perms: MyPermissions;
  currentUserId: string;
}) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [editSchedule, setEditSchedule] = useState<Schedule | null>(null);
  const [filter, setFilter] = useState<"all" | "pending" | "completed">("all");
  const [subjectFilter, setSubjectFilter] = useState<string | null>(null);
  const [tagFilter, setTagFilter] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const { data: schedules = [], isLoading } = useQuery({
    queryKey: ["schedules", groupId],
    queryFn: () => schedulesApi.list(groupId),
  });
  const { data: subjects = [] } = useQuery({
    queryKey: ["subjects", groupId],
    queryFn: () => groupsApi.subjects(groupId),
  });
  const { data: tags = [] } = useQuery({
    queryKey: ["tags", groupId],
    queryFn: () => groupsApi.tags(groupId),
  });

  const invalidate = () =>
    qc.invalidateQueries({ queryKey: ["schedules", groupId] });

  const handleComplete = async (schedule: Schedule) => {
    try {
      if (schedule.completed_by_me) {
        await schedulesApi.uncomplete(groupId, schedule.id);
      } else {
        await schedulesApi.complete(groupId, schedule.id);
      }
      invalidate();
    } catch (err) {
      toast(extractApiError(err), "error");
    }
  };

  const handleCreate = async (data: ScheduleCreatePayload) => {
    setSaving(true);
    try {
      await schedulesApi.create(groupId, data);
      invalidate();
      setCreateOpen(false);
      toast("スケジュールを作成しました！", "success");
    } catch (err) {
      toast(extractApiError(err), "error");
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = async (data: Partial<ScheduleCreatePayload>) => {
    if (!editSchedule) return;
    setSaving(true);
    try {
      await schedulesApi.update(groupId, editSchedule.id, data);
      invalidate();
      setEditSchedule(null);
      toast("スケジュールを更新しました！", "success");
    } catch (err) {
      toast(extractApiError(err), "error");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (schedule: Schedule) => {
    if (!confirm(`「${schedule.title}」を削除しますか？`)) return;
    try {
      await schedulesApi.delete(groupId, schedule.id);
      invalidate();
      toast("スケジュールを削除しました。", "success");
    } catch (err) {
      toast(extractApiError(err), "error");
    }
  };

  const FILTER_LABELS = {
    all: "すべて",
    pending: "未完了",
    completed: "完了",
  } as const;

  const filtered = schedules.filter((s) => {
    if (filter === "pending" && s.completed_by_me) return false;
    if (filter === "completed" && !s.completed_by_me) return false;
    if (subjectFilter && s.subject?.id !== subjectFilter) return false;
    if (tagFilter && !s.tags.some((t) => t.id === tagFilter)) return false;
    return true;
  });

  const hasFilters = subjectFilter || tagFilter;

  return (
    <div className="max-w-3xl space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-1 rounded-lg bg-zinc-100 p-1">
          {(["all", "pending", "completed"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                "rounded-md px-3 py-1 text-xs font-medium transition-all",
                filter === f
                  ? "bg-white text-zinc-900 shadow-sm"
                  : "text-zinc-500 hover:text-zinc-700",
              )}
            >
              {FILTER_LABELS[f]}
            </button>
          ))}
        </div>
        {perms.can_edit_schedule && (
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4" /> スケジュール追加
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>新規スケジュール</DialogTitle>
              </DialogHeader>
              <ScheduleForm
                subjects={subjects}
                tags={tags}
                onSubmit={handleCreate}
                loading={saving}
              />
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Subject / Tag filters */}
      {(subjects.length > 0 || tags.length > 0) && (
        <div className="space-y-2">
          {subjects.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-xs text-zinc-400 shrink-0">科目:</span>
              <button
                onClick={() => setSubjectFilter(null)}
                className={cn(
                  "rounded-full px-2.5 py-0.5 text-xs font-medium border transition-colors",
                  !subjectFilter
                    ? "bg-zinc-800 text-white border-zinc-800"
                    : "bg-white text-zinc-500 border-zinc-200 hover:border-zinc-400",
                )}
              >
                すべて
              </button>
              {subjects.map((s) => (
                <button
                  key={s.id}
                  onClick={() =>
                    setSubjectFilter(subjectFilter === s.id ? null : s.id)
                  }
                  className={cn(
                    "rounded-full px-2.5 py-0.5 text-xs font-medium border transition-colors",
                    subjectFilter === s.id
                      ? "bg-brand-600 text-white border-brand-600"
                      : "bg-white text-zinc-600 border-zinc-200 hover:border-zinc-400",
                  )}
                >
                  {s.name}
                </button>
              ))}
            </div>
          )}
          {tags.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-xs text-zinc-400 shrink-0">タグ:</span>
              <button
                onClick={() => setTagFilter(null)}
                className={cn(
                  "rounded-full px-2.5 py-0.5 text-xs font-medium border transition-colors",
                  !tagFilter
                    ? "bg-zinc-800 text-white border-zinc-800"
                    : "bg-white text-zinc-500 border-zinc-200 hover:border-zinc-400",
                )}
              >
                すべて
              </button>
              {[...tags]
                .sort((a, b) => a.priority - b.priority)
                .map((t) => (
                  <button
                    key={t.id}
                    onClick={() =>
                      setTagFilter(tagFilter === t.id ? null : t.id)
                    }
                    className="flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium border transition-all"
                    style={
                      tagFilter === t.id
                        ? {
                            backgroundColor: t.color,
                            borderColor: t.color,
                            color: "#fff",
                          }
                        : {
                            backgroundColor: "#fff",
                            borderColor: t.color,
                            color: "#3f3f46",
                          }
                    }
                  >
                    <span
                      className="h-1.5 w-1.5 rounded-full shrink-0"
                      style={{
                        backgroundColor:
                          tagFilter === t.id
                            ? "rgba(255,255,255,0.7)"
                            : t.color,
                      }}
                    />
                    #{t.name}
                  </button>
                ))}
            </div>
          )}
          {hasFilters && (
            <button
              onClick={() => {
                setSubjectFilter(null);
                setTagFilter(null);
              }}
              className="text-xs text-zinc-400 hover:text-zinc-600 underline"
            >
              絞り込みをリセット
            </button>
          )}
        </div>
      )}

      {isLoading ? (
        <PageLoader />
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-sm text-zinc-500">
            {hasFilters || filter !== "all"
              ? "条件に一致するスケジュールはありません。"
              : "スケジュールはまだありません。"}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((s) => (
            <ScheduleCard
              key={s.id}
              schedule={s}
              groupId={groupId}
              permissions={perms}
              currentUserId={currentUserId}
              onComplete={() => handleComplete(s)}
              onEdit={() => setEditSchedule(s)}
              onDelete={() => handleDelete(s)}
            />
          ))}
        </div>
      )}

      {/* Edit dialog */}
      <Dialog
        open={!!editSchedule}
        onOpenChange={(o) => !o && setEditSchedule(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>スケジュール編集</DialogTitle>
          </DialogHeader>
          {editSchedule && (
            <ScheduleForm
              defaultValues={editSchedule}
              subjects={subjects}
              tags={tags}
              onSubmit={handleEdit}
              submitLabel="更新"
              loading={saving}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ── Members Tab ────────────────────────────────────────────────────────────────

function MembersTab({
  groupId,
  perms,
  ownerId,
  currentUserId,
}: {
  groupId: string;
  perms: MyPermissions;
  ownerId: string;
  currentUserId: string;
}) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [inviteUsername, setInviteUsername] = useState("");
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviting, setInviting] = useState(false);
  const [roleTarget, setRoleTarget] = useState<{
    userId: string;
    nickname: string;
    currentRoles: { id: string; name: string }[];
  } | null>(null);
  const [roleFilter, setRoleFilter] = useState<string | null>(null);

  const { data: members = [], isLoading } = useQuery({
    queryKey: ["members", groupId],
    queryFn: () => groupsApi.members(groupId),
  });
  const { data: pending = [] } = useQuery({
    queryKey: ["pending-members", groupId],
    queryFn: () => groupsApi.pendingMembers(groupId),
    enabled: perms.can_invite_user,
  });
  const { data: banned = [] } = useQuery({
    queryKey: ["banned-members", groupId],
    queryFn: () => groupsApi.bannedMembers(groupId),
    enabled: perms.can_remove_member,
  });
  const { data: pendingInvites = [] as PendingInvite[] } = useQuery({
    queryKey: ["pending-invites", groupId],
    queryFn: () => groupsApi.pendingInvites(groupId),
    enabled: perms.can_invite_user,
  });
  const { data: roles = [] } = useQuery({
    queryKey: ["roles", groupId],
    queryFn: () => groupsApi.roles(groupId),
  });

  const invalidateMembers = () => {
    qc.invalidateQueries({ queryKey: ["members", groupId] });
    qc.invalidateQueries({ queryKey: ["pending-members", groupId] });
    qc.invalidateQueries({ queryKey: ["banned-members", groupId] });
    qc.invalidateQueries({ queryKey: ["pending-invites", groupId] });
  };

  const handleInvite = async () => {
    if (!inviteUsername.trim()) return;
    setInviting(true);
    try {
      await groupsApi.invite(groupId, inviteUsername.trim());
      toast("招待を送りました！", "success");
      setInviteOpen(false);
      setInviteUsername("");
      qc.invalidateQueries({ queryKey: ["pending-invites", groupId] });
    } catch (err) {
      toast(extractApiError(err), "error");
    } finally {
      setInviting(false);
    }
  };

  const handleCancelInvite = async (inviteId: string, nickname: string) => {
    if (!confirm(`${nickname} への招待を取り消しますか？`)) return;
    try {
      await groupsApi.cancelInvite(groupId, inviteId);
      qc.invalidateQueries({ queryKey: ["pending-invites", groupId] });
      toast("招待を取り消しました。", "success");
    } catch (err) {
      toast(extractApiError(err), "error");
    }
  };

  const handleApprove = async (userId: string) => {
    try {
      await groupsApi.approve(groupId, userId);
      invalidateMembers();
      toast("メンバーを承認しました！", "success");
    } catch (err) {
      toast(extractApiError(err), "error");
    }
  };

  const handleRemove = async (userId: string, name: string) => {
    if (!confirm(`${name} をグループから削除しますか？`)) return;
    try {
      await groupsApi.removeMember(groupId, userId);
      invalidateMembers();
      toast("メンバーを削除しました。", "success");
    } catch (err) {
      toast(extractApiError(err), "error");
    }
  };

  const handleBan = async (userId: string, name: string) => {
    if (!confirm(`${name} をBanしますか？再参加できなくなります。`)) return;
    try {
      await groupsApi.ban(groupId, userId);
      invalidateMembers();
      toast("メンバーをBanしました。", "success");
    } catch (err) {
      toast(extractApiError(err), "error");
    }
  };

  const handleUnban = async (userId: string, name: string) => {
    if (!confirm(`${name} のBanを解除しますか？`)) return;
    try {
      await groupsApi.unban(groupId, userId);
      invalidateMembers();
      toast("Banを解除しました。", "success");
    } catch (err) {
      toast(extractApiError(err), "error");
    }
  };

  const handleAssignRole = async (userId: string, roleId: string) => {
    try {
      await groupsApi.assignRole(groupId, userId, roleId);
      invalidateMembers();
      setRoleTarget((prev) =>
        prev
          ? {
              ...prev,
              currentRoles: [
                ...prev.currentRoles,
                {
                  id: roleId,
                  name: roles.find((r) => r.id === roleId)?.name ?? "",
                },
              ],
            }
          : null,
      );
      toast("ロールを付与しました！", "success");
    } catch (err) {
      toast(extractApiError(err), "error");
    }
  };

  const handleRemoveRole = async (userId: string, roleId: string) => {
    try {
      await groupsApi.removeRole(groupId, userId, roleId);
      invalidateMembers();
      setRoleTarget((prev) =>
        prev
          ? {
              ...prev,
              currentRoles: prev.currentRoles.filter((r) => r.id !== roleId),
            }
          : null,
      );
      toast("ロールを削除しました。", "success");
    } catch (err) {
      toast(extractApiError(err), "error");
    }
  };

  const filteredMembers = roleFilter
    ? members.filter((m) => m.roles?.some((r) => r.id === roleFilter))
    : members;

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-zinc-700">
          メンバー ({filteredMembers.length}
          {roleFilter ? `/${members.length}` : ""})
        </h3>
        {perms.can_invite_user && (
          <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <UserPlus className="h-4 w-4" /> 招待
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>ユーザーを招待</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <FormField label="ユーザーID">
                  <Input
                    value={inviteUsername}
                    onChange={(e) => setInviteUsername(e.target.value)}
                    placeholder="ユーザーのUUIDを入力"
                  />
                </FormField>
                <div className="flex justify-end">
                  <Button onClick={handleInvite} loading={inviting}>
                    招待を送る
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Role filter */}
      {roles.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs text-zinc-400 shrink-0">ロール:</span>
          <button
            onClick={() => setRoleFilter(null)}
            className={cn(
              "rounded-full px-2.5 py-0.5 text-xs font-medium border transition-colors",
              !roleFilter
                ? "bg-zinc-800 text-white border-zinc-800"
                : "bg-white text-zinc-500 border-zinc-200 hover:border-zinc-400",
            )}
          >
            すべて
          </button>
          {roles.map((role) => (
            <button
              key={role.id}
              onClick={() =>
                setRoleFilter(roleFilter === role.id ? null : role.id)
              }
              className={cn(
                "rounded-full px-2.5 py-0.5 text-xs font-medium border transition-colors",
                roleFilter === role.id
                  ? "bg-brand-600 text-white border-brand-600"
                  : "bg-white text-zinc-600 border-zinc-200 hover:border-zinc-400",
              )}
            >
              {role.name}
            </button>
          ))}
        </div>
      )}

      {/* Pending requests */}
      {pending.length > 0 && (
        <div>
          <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-400">
            参加リクエスト ({pending.length})
          </h4>
          <div className="divide-y divide-zinc-100 rounded-xl border border-zinc-200 bg-white overflow-hidden">
            {pending.map((rel) => (
              <div key={rel.id} className="flex items-center gap-3 px-4 py-3">
                <Link href={`/users/${rel.user.id}`} className="flex items-center gap-3 flex-1 min-w-0 hover:opacity-75 transition-opacity">
                  <Avatar>
                    <AvatarFallback>
                      {getInitials(rel.user.nickname)}
                    </AvatarFallback>
                  </Avatar>
                  <p className="text-sm font-medium text-zinc-900 truncate">
                    {rel.user.nickname}
                  </p>
                </Link>
                {perms.can_invite_user && (
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => handleApprove(rel.user.id)}
                    >
                      承認
                    </Button>
                    <Button
                      size="sm"
                      variant="danger-outline"
                      onClick={() => handleBan(rel.user.id, rel.user.nickname)}
                    >
                      拒否
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Pending invites */}
      {perms.can_invite_user && pendingInvites.length > 0 && (
        <div>
          <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-400">
            招待中 ({pendingInvites.length})
          </h4>
          <div className="divide-y divide-zinc-100 rounded-xl border border-zinc-200 bg-white overflow-hidden">
            {pendingInvites.map((inv) => (
              <div key={inv.id} className="flex items-center gap-3 px-4 py-3">
                <Link href={`/users/${inv.user.id}`} className="flex items-center gap-3 flex-1 min-w-0 hover:opacity-75 transition-opacity">
                  <Avatar>
                    <AvatarFallback>{getInitials(inv.user.nickname)}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-zinc-900 truncate">{inv.user.nickname}</p>
                    <p className="text-xs text-zinc-400">招待者: {inv.invited_by.nickname}</p>
                  </div>
                </Link>
                <Button
                  size="sm"
                  variant="danger-outline"
                  onClick={() => handleCancelInvite(inv.id, inv.user.nickname)}
                >
                  取り消し
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Members list */}
      {isLoading ? (
        <PageLoader />
      ) : (
        <div className="divide-y divide-zinc-100 rounded-xl border border-zinc-200 bg-white overflow-hidden">
          {filteredMembers.map((rel) => (
            <div key={rel.id} className="flex items-center gap-3 px-4 py-3">
              <Link href={`/users/${rel.user.id}`} className="shrink-0 hover:opacity-75 transition-opacity">
                <Avatar>
                  <AvatarFallback>
                    {getInitials(rel.user.nickname)}
                  </AvatarFallback>
                </Avatar>
              </Link>
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-1.5">
                  <Link href={`/users/${rel.user.id}`} className="text-sm font-medium text-zinc-900 hover:underline">
                    {rel.user.nickname}
                  </Link>
                  {rel.user.id === ownerId && (
                    <Badge
                      variant="warning"
                      className="flex items-center gap-1 text-xs"
                    >
                      <Crown className="h-2.5 w-2.5" /> オーナー
                    </Badge>
                  )}
                  {rel.roles?.map((role) => (
                    <Badge key={role.id} variant="brand" className="text-xs">
                      {role.name}
                    </Badge>
                  ))}
                </div>
                <p className="text-xs text-zinc-500 mt-0.5">
                  参加日: {formatDate(rel.joined_at)}
                </p>
              </div>
              <div className="flex shrink-0 gap-1">
                {perms.can_manage_role && roles.length > 0 && (
                  <Button
                    size="icon-sm"
                    variant="ghost"
                    title="ロールを管理"
                    onClick={() =>
                      setRoleTarget({
                        userId: rel.user.id,
                        nickname: rel.user.nickname,
                        currentRoles: rel.roles ?? [],
                      })
                    }
                  >
                    <Shield className="h-3.5 w-3.5 text-zinc-500" />
                  </Button>
                )}
                {perms.can_remove_member &&
                  rel.user.id !== ownerId &&
                  rel.user.id !== currentUserId && (
                    <>
                      <Button
                        size="icon-sm"
                        variant="ghost"
                        className="text-amber-500 hover:bg-amber-50"
                        onClick={() =>
                          handleBan(rel.user.id, rel.user.nickname)
                        }
                        title="Ban"
                      >
                        <Ban className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        size="icon-sm"
                        variant="ghost"
                        className="text-red-500 hover:bg-red-50"
                        onClick={() =>
                          handleRemove(rel.user.id, rel.user.nickname)
                        }
                        title="削除"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </>
                  )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Banned members */}
      {perms.can_remove_member && banned.length > 0 && (
        <div>
          <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-400">
            Banされたメンバー ({banned.length})
          </h4>
          <div className="divide-y divide-zinc-100 rounded-xl border border-zinc-200 bg-white overflow-hidden">
            {banned.map((rel) => (
              <div key={rel.id} className="flex items-center gap-3 px-4 py-3">
                <Link href={`/users/${rel.user.id}`} className="flex items-center gap-3 flex-1 min-w-0 hover:opacity-75 transition-opacity">
                  <Avatar>
                    <AvatarFallback>
                      {getInitials(rel.user.nickname)}
                    </AvatarFallback>
                  </Avatar>
                  <p className="text-sm font-medium text-zinc-500 truncate">{rel.user.nickname}</p>
                </Link>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleUnban(rel.user.id, rel.user.nickname)}
                >
                  <UserCheck className="h-3.5 w-3.5" /> Ban解除
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Role assignment dialog */}
      <Dialog
        open={!!roleTarget}
        onOpenChange={(o) => !o && setRoleTarget(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>ロールを管理 — {roleTarget?.nickname}</DialogTitle>
          </DialogHeader>
          {roleTarget && (
            <div className="space-y-3 pt-1">
              {roles.map((role) => {
                const assigned = roleTarget.currentRoles.some(
                  (r) => r.id === role.id,
                );
                return (
                  <div
                    key={role.id}
                    className="flex items-center justify-between rounded-lg border border-zinc-100 bg-zinc-50 px-3 py-2.5"
                  >
                    <div>
                      <p className="text-sm font-medium text-zinc-900">
                        {role.name}
                      </p>
                      <p className="text-xs text-zinc-400">
                        {(Object.keys(PERM_LABELS) as (keyof RolePermission)[])
                          .filter((k) => role.permission?.[k])
                          .map((k) => PERM_LABELS[k])
                          .join("、") || "権限なし"}
                      </p>
                    </div>
                    {assigned ? (
                      <Button
                        size="sm"
                        variant="danger-outline"
                        onClick={() =>
                          handleRemoveRole(roleTarget.userId, role.id)
                        }
                      >
                        削除
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          handleAssignRole(roleTarget.userId, role.id)
                        }
                      >
                        付与
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ── Roles Tab ──────────────────────────────────────────────────────────────────

const PERM_LABELS: Record<keyof RolePermission, string> = {
  can_invite_user: "ユーザー招待",
  can_remove_member: "メンバー削除",
  can_manage_role: "ロール管理",
  can_edit_group: "グループ編集",
  can_edit_schedule: "スケジュール編集",
  can_manage_subject: "科目管理",
  can_manage_tag: "タグ管理",
  can_manage_webhook: "Webhook管理",
};

function RolesTab({
  groupId,
  perms,
}: {
  groupId: string;
  perms: MyPermissions;
}) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [roleName, setRoleName] = useState("");
  const [rolePerms, setRolePerms] = useState<RolePermission>({
    can_invite_user: false,
    can_remove_member: false,
    can_manage_role: false,
    can_edit_group: false,
    can_edit_schedule: false,
    can_manage_subject: false,
    can_manage_tag: false,
    can_manage_webhook: false,
  });
  const [saving, setSaving] = useState(false);

  const { data: roles = [], isLoading } = useQuery({
    queryKey: ["roles", groupId],
    queryFn: () => groupsApi.roles(groupId),
  });

  const handleCreate = async () => {
    if (!roleName.trim()) return;
    setSaving(true);
    try {
      await groupsApi.createRole(groupId, {
        name: roleName,
        permission: rolePerms,
      });
      qc.invalidateQueries({ queryKey: ["roles", groupId] });
      setCreateOpen(false);
      setRoleName("");
      toast("ロールを作成しました！", "success");
    } catch (err) {
      toast(extractApiError(err), "error");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (role: GroupRole) => {
    if (!confirm(`ロール「${role.name}」を削除しますか？`)) return;
    try {
      await groupsApi.deleteRole(groupId, role.id);
      qc.invalidateQueries({ queryKey: ["roles", groupId] });
      toast("ロールを削除しました。", "success");
    } catch (err) {
      toast(extractApiError(err), "error");
    }
  };

  const { data: members = [] } = useQuery({
    queryKey: ["members", groupId],
    queryFn: () => groupsApi.members(groupId),
  });

  return (
    <div className="max-w-3xl space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-zinc-700">
          ロール ({roles.length})
        </h3>
        {perms.can_manage_role && (
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4" /> 新規ロール
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>ロールを作成</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <FormField label="ロール名" required>
                  <Input
                    value={roleName}
                    onChange={(e) => setRoleName(e.target.value)}
                    placeholder="モデレーター"
                  />
                </FormField>
                <div>
                  <p className="mb-2 text-sm font-medium text-zinc-700">権限</p>
                  <div className="space-y-2">
                    {(Object.keys(PERM_LABELS) as (keyof RolePermission)[]).map(
                      (key) => (
                        <label
                          key={key}
                          className="flex items-center gap-2 cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={rolePerms[key]}
                            onChange={(e) =>
                              setRolePerms((p) => ({
                                ...p,
                                [key]: e.target.checked,
                              }))
                            }
                            className="h-4 w-4 rounded border-zinc-300 text-brand-600 focus:ring-brand-500"
                          />
                          <span className="text-sm text-zinc-700">
                            {PERM_LABELS[key]}
                          </span>
                        </label>
                      ),
                    )}
                  </div>
                </div>
                <div className="flex justify-end">
                  <Button onClick={handleCreate} loading={saving}>
                    ロールを作成
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {isLoading ? (
        <PageLoader />
      ) : roles.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-sm text-zinc-500">
            ロールはまだ作成されていません。
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {roles.map((role) => {
            const assignedMembers = members.filter((m) =>
              m.roles?.some((r) => r.id === role.id),
            );
            return (
              <Card key={role.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-zinc-900">{role.name}</p>
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {(Object.keys(PERM_LABELS) as (keyof RolePermission)[])
                          .filter((k) => role.permission?.[k])
                          .map((k) => (
                            <Badge key={k} variant="brand" className="text-xs">
                              {PERM_LABELS[k]}
                            </Badge>
                          ))}
                        {!Object.values(role.permission ?? {}).some(
                          Boolean,
                        ) && (
                          <span className="text-xs text-zinc-400">
                            権限なし
                          </span>
                        )}
                      </div>
                      {assignedMembers.length > 0 && (
                        <div className="mt-3 flex flex-wrap items-center gap-1.5">
                          <span className="text-xs text-zinc-400">
                            割り当て先:
                          </span>
                          {assignedMembers.map((m) => (
                            <span
                              key={m.user.id}
                              className="flex items-center gap-1 rounded-full bg-zinc-100 px-2 py-0.5 text-xs text-zinc-700"
                            >
                              <Avatar className="h-4 w-4 text-[9px]">
                                <AvatarFallback>
                                  {getInitials(m.user.nickname)}
                                </AvatarFallback>
                              </Avatar>
                              {m.user.nickname}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    {perms.can_manage_role && (
                      <Button
                        size="icon-sm"
                        variant="ghost"
                        className="text-red-500 hover:bg-red-50"
                        onClick={() => handleDelete(role)}
                        title="ロールを削除"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Settings Tab ───────────────────────────────────────────────────────────────

function SettingsTab({
  group,
  perms,
  isOwner,
  isMember,
}: {
  group: any;
  perms: MyPermissions;
  isOwner: boolean;
  isMember: boolean;
}) {
  const { toast } = useToast();
  const router = useRouter();
  const qc = useQueryClient();
  const [editOpen, setEditOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [transferOpen, setTransferOpen] = useState(false);
  const [transferUserId, setTransferUserId] = useState("");
  const [transferLoading, setTransferLoading] = useState(false);

  const [subjectName, setSubjectName] = useState("");
  const [editingSubjectId, setEditingSubjectId] = useState<string | null>(null);
  const [editSubjectName, setEditSubjectName] = useState("");
  const [tagName, setTagName] = useState("");
  const [tagColor, setTagColor] = useState("#6B7280");
  const [editingTagId, setEditingTagId] = useState<string | null>(null);
  const [editTagName, setEditTagName] = useState("");
  const [editTagColor, setEditTagColor] = useState("#6B7280");

  // Webhook dialog state
  const [webhookDialog, setWebhookDialog] = useState<{
    type: WebhookType;
    id: string | null;
  } | null>(null);
  const [webhookUrl, setWebhookUrl] = useState("");
  const [webhookName, setWebhookName] = useState("");
  const [webhookSaving, setWebhookSaving] = useState(false);

  const { data: subjects = [] } = useQuery({
    queryKey: ["subjects", group.id],
    queryFn: () => groupsApi.subjects(group.id),
  });
  const { data: tags = [] } = useQuery({
    queryKey: ["tags", group.id],
    queryFn: () => groupsApi.tags(group.id),
  });
  const { data: webhooks = [] } = useQuery({
    queryKey: ["webhooks", group.id],
    queryFn: () => groupsApi.webhooks(group.id),
    enabled: perms.can_manage_webhook,
  });
  const { data: settingsMembers = [] } = useQuery({
    queryKey: ["members", group.id],
    queryFn: () => groupsApi.members(group.id),
    enabled: isOwner,
  });

  const openWebhookDialog = (
    type: WebhookType,
    existing: GroupWebhook | null,
  ) => {
    setWebhookDialog({ type, id: existing?.id ?? null });
    setWebhookUrl("");
    setWebhookName(existing?.name ?? "");
  };

  const handleWebhookSave = async () => {
    if (!webhookDialog) return;
    setWebhookSaving(true);
    try {
      if (webhookDialog.id) {
        const data: { url?: string; name?: string } = {
          name: webhookName.trim(),
        };
        if (webhookUrl.trim()) data.url = webhookUrl.trim();
        await groupsApi.updateWebhook(group.id, webhookDialog.id, data);
        toast("Webhookを更新しました！", "success");
      } else {
        if (!webhookUrl.trim()) return;
        await groupsApi.createWebhook(
          group.id,
          webhookDialog.type,
          webhookUrl.trim(),
          webhookName.trim(),
        );
        toast("Webhookを登録しました！", "success");
      }
      qc.invalidateQueries({ queryKey: ["webhooks", group.id] });
      setWebhookDialog(null);
    } catch (err) {
      toast(extractApiError(err), "error");
    } finally {
      setWebhookSaving(false);
    }
  };

  const handleWebhookDelete = async (webhook: GroupWebhook) => {
    const displayName =
      webhook.name ||
      (webhook.webhook_type === "remind" ? "リマインド" : "作成ログ");
    if (!confirm(`「${displayName}」Webhookを削除しますか？`)) return;
    try {
      await groupsApi.deleteWebhook(group.id, webhook.id);
      qc.invalidateQueries({ queryKey: ["webhooks", group.id] });
      toast("Webhookを削除しました。", "success");
    } catch (err) {
      toast(extractApiError(err), "error");
    }
  };

  const handleEditGroup = async (data: any) => {
    try {
      await groupsApi.update(group.id, data);
      qc.invalidateQueries({ queryKey: ["group", group.id] });
      setEditOpen(false);
      toast("グループを更新しました！", "success");
    } catch (err) {
      toast(extractApiError(err), "error");
    }
  };

  const handleDeleteGroup = async () => {
    if (
      !confirm(
        `「${group.name}」を完全に削除しますか？この操作は元に戻せません。`,
      )
    )
      return;
    setDeleteLoading(true);
    try {
      await groupsApi.delete(group.id);
      qc.invalidateQueries({ queryKey: ["groups"] });
      router.push("/groups");
      toast("グループを削除しました。", "success");
    } catch (err) {
      toast(extractApiError(err), "error");
      setDeleteLoading(false);
    }
  };

  const handleLeave = async () => {
    if (!confirm("このグループを退出しますか？")) return;
    try {
      await groupsApi.leave(group.id);
      qc.invalidateQueries({ queryKey: ["groups"] });
      router.push("/groups");
    } catch (err) {
      toast(extractApiError(err), "error");
    }
  };

  const handleTransfer = async () => {
    if (!transferUserId) return;
    const target = settingsMembers.find((m) => m.user.id === transferUserId);
    if (!confirm(`オーナー権限を「${target?.user.nickname}」に移譲しますか？\nあなたはオーナーでなくなります。`)) return;
    setTransferLoading(true);
    try {
      await groupsApi.transfer(group.id, transferUserId);
      qc.invalidateQueries({ queryKey: ["group", group.id] });
      qc.invalidateQueries({ queryKey: ["my-permissions", group.id] });
      setTransferOpen(false);
      setTransferUserId("");
      toast("オーナーを移譲しました。", "success");
    } catch (err) {
      toast(extractApiError(err), "error");
    } finally {
      setTransferLoading(false);
    }
  };

  const handleAddSubject = async () => {
    if (!subjectName.trim()) return;
    try {
      await groupsApi.createSubject(group.id, subjectName.trim());
      qc.invalidateQueries({ queryKey: ["subjects", group.id] });
      setSubjectName("");
      toast("科目を追加しました！", "success");
    } catch (err) {
      toast(extractApiError(err), "error");
    }
  };

  const handleUpdateSubject = async (subjectId: string) => {
    const name = editSubjectName.trim();
    if (!name) return;
    try {
      await groupsApi.updateSubject(group.id, subjectId, name);
      qc.invalidateQueries({ queryKey: ["subjects", group.id] });
      setEditingSubjectId(null);
      toast("科目名を更新しました！", "success");
    } catch (err) {
      toast(extractApiError(err), "error");
    }
  };

  const handleAddTag = async () => {
    if (!tagName.trim()) return;
    try {
      await groupsApi.createTag(group.id, tagName.trim(), tagColor);
      qc.invalidateQueries({ queryKey: ["tags", group.id] });
      setTagName("");
      setTagColor("#6B7280");
      toast("タグを追加しました！", "success");
    } catch (err) {
      toast(extractApiError(err), "error");
    }
  };

  const handleUpdateTag = async (tagId: string) => {
    const name = editTagName.trim();
    if (!name) return;
    try {
      await groupsApi.updateTag(group.id, tagId, { name, color: editTagColor });
      qc.invalidateQueries({ queryKey: ["tags", group.id] });
      setEditingTagId(null);
      toast("タグを更新しました！", "success");
    } catch (err) {
      toast(extractApiError(err), "error");
    }
  };

  const handleMoveTag = async (idx: number, dir: -1 | 1) => {
    const newOrder = [...tags];
    const tmp = newOrder[idx];
    newOrder[idx] = newOrder[idx + dir];
    newOrder[idx + dir] = tmp;
    try {
      await groupsApi.reorderTags(
        group.id,
        newOrder.map((t) => t.id),
      );
      qc.invalidateQueries({ queryKey: ["tags", group.id] });
    } catch (err) {
      toast(extractApiError(err), "error");
    }
  };

  return (
    <div className="max-w-2xl space-y-6">
      {/* Group info */}
      {perms.can_edit_group && (
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-zinc-700">
                グループ情報
              </h3>
              <Dialog open={editOpen} onOpenChange={setEditOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" variant="outline">
                    <Edit2 className="h-3.5 w-3.5" /> 編集
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>グループを編集</DialogTitle>
                  </DialogHeader>
                  <GroupForm
                    defaultValues={group}
                    onSubmit={handleEditGroup}
                    submitLabel="変更を保存"
                  />
                </DialogContent>
              </Dialog>
            </div>
            <p className="text-sm text-zinc-500">
              グループ名・説明・公開設定を変更できます。
            </p>
          </CardContent>
        </Card>
      )}

      {/* Subjects */}
      {perms.can_manage_subject && (
        <Card>
          <CardContent className="p-5 space-y-3">
            <h3 className="text-sm font-semibold text-zinc-700">科目</h3>
            <div className="flex gap-2">
              <Input
                value={subjectName}
                onChange={(e) => setSubjectName(e.target.value)}
                placeholder="新しい科目名"
                onKeyDown={(e) => e.key === "Enter" && handleAddSubject()}
              />
              <Button size="md" onClick={handleAddSubject}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {subjects.map((s) =>
                editingSubjectId === s.id ? (
                  <div
                    key={s.id}
                    className="flex items-center gap-1 rounded-full border border-brand-400 bg-white pl-2 pr-1 py-1"
                  >
                    <input
                      className="text-xs w-28 outline-none text-zinc-700"
                      value={editSubjectName}
                      onChange={(e) => setEditSubjectName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleUpdateSubject(s.id);
                        if (e.key === "Escape") setEditingSubjectId(null);
                      }}
                      autoFocus
                    />
                    <button
                      className="rounded-full p-0.5 text-green-600 hover:text-green-700"
                      onClick={() => handleUpdateSubject(s.id)}
                      title="保存"
                    >
                      ✓
                    </button>
                    <button
                      className="rounded-full p-0.5 text-zinc-400 hover:text-zinc-600"
                      onClick={() => setEditingSubjectId(null)}
                      title="キャンセル"
                    >
                      ✗
                    </button>
                  </div>
                ) : (
                  <div
                    key={s.id}
                    className="flex items-center gap-1 rounded-full bg-zinc-100 pl-3 pr-1 py-1"
                  >
                    <span className="text-xs text-zinc-700">{s.name}</span>
                    <button
                      className="rounded-full p-0.5 text-zinc-400 hover:text-blue-500"
                      onClick={() => {
                        setEditingSubjectId(s.id);
                        setEditSubjectName(s.name);
                      }}
                      title="編集"
                    >
                      <Edit2 className="h-2.5 w-2.5" />
                    </button>
                    <button
                      className="rounded-full p-0.5 text-zinc-400 hover:text-red-500"
                      onClick={async () => {
                        await groupsApi.deleteSubject(group.id, s.id);
                        qc.invalidateQueries({
                          queryKey: ["subjects", group.id],
                        });
                      }}
                      title="削除"
                    >
                      ×
                    </button>
                  </div>
                ),
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tags */}
      {perms.can_manage_tag && (
        <Card>
          <CardContent className="p-5 space-y-3">
            <h3 className="text-sm font-semibold text-zinc-700">タグ</h3>

            {/* Color picker */}
            <div className="flex flex-wrap gap-1.5">
              {TAG_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  title={c}
                  onClick={() => setTagColor(c)}
                  className="h-6 w-6 rounded-full border-2 transition-transform hover:scale-110"
                  style={{
                    backgroundColor: c,
                    borderColor: tagColor === c ? "#18181b" : "transparent",
                    transform: tagColor === c ? "scale(1.15)" : undefined,
                  }}
                />
              ))}
            </div>

            {/* Name input + add button */}
            <div className="flex gap-2">
              <div
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full"
                style={{ backgroundColor: tagColor }}
              />
              <Input
                value={tagName}
                onChange={(e) => setTagName(e.target.value)}
                placeholder="新しいタグ名"
                onKeyDown={(e) => e.key === "Enter" && handleAddTag()}
              />
              <Button size="md" onClick={handleAddTag}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            {/* Vertical tag list with reorder */}
            {tags.length > 0 && (
              <ul className="space-y-1">
                {tags.map((t, idx) => (
                  <li
                    key={t.id}
                    className="flex items-center gap-2 rounded-lg border border-zinc-100 bg-white px-3 py-2"
                  >
                    <div
                      className="h-3 w-3 shrink-0 rounded-full transition-colors"
                      style={{ backgroundColor: editingTagId === t.id ? editTagColor : t.color }}
                    />
                    {editingTagId === t.id ? (
                      <div className="flex-1 space-y-1.5">
                        <div className="flex flex-wrap gap-1">
                          {TAG_COLORS.map((c) => (
                            <button
                              key={c}
                              type="button"
                              onClick={() => setEditTagColor(c)}
                              className="h-4 w-4 rounded-full border-2 transition-transform hover:scale-110"
                              style={{
                                backgroundColor: c,
                                borderColor: editTagColor === c ? "#18181b" : "transparent",
                              }}
                            />
                          ))}
                        </div>
                        <input
                          className="w-full text-sm text-zinc-700 outline-none border-b border-brand-400"
                          value={editTagName}
                          onChange={(e) => setEditTagName(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") handleUpdateTag(t.id);
                            if (e.key === "Escape") setEditingTagId(null);
                          }}
                          autoFocus
                        />
                      </div>
                    ) : (
                      <span className="flex-1 text-sm text-zinc-700">
                        #{t.name}
                      </span>
                    )}
                    {editingTagId === t.id ? (
                      <div className="flex items-center gap-0.5 shrink-0">
                        <button
                          onClick={() => handleUpdateTag(t.id)}
                          className="rounded p-0.5 text-green-600 hover:text-green-700"
                          title="保存"
                        >
                          ✓
                        </button>
                        <button
                          onClick={() => setEditingTagId(null)}
                          className="rounded p-0.5 text-zinc-400 hover:text-zinc-600"
                          title="キャンセル"
                        >
                          ✗
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-0.5 text-zinc-400">
                        <button
                          onClick={() => {
                            setEditingTagId(t.id);
                            setEditTagName(t.name);
                            setEditTagColor(t.color);
                          }}
                          className="rounded p-0.5 hover:bg-zinc-100 hover:text-blue-500"
                          title="編集"
                        >
                          <Edit2 className="h-3 w-3" />
                        </button>
                        <button
                          disabled={idx === 0}
                          onClick={() => handleMoveTag(idx, -1)}
                          className="rounded p-0.5 hover:bg-zinc-100 hover:text-zinc-700 disabled:opacity-30"
                          title="上へ"
                        >
                          ↑
                        </button>
                        <button
                          disabled={idx === tags.length - 1}
                          onClick={() => handleMoveTag(idx, 1)}
                          className="rounded p-0.5 hover:bg-zinc-100 hover:text-zinc-700 disabled:opacity-30"
                          title="下へ"
                        >
                          ↓
                        </button>
                        <button
                          className="text-zinc-400 hover:text-red-500 transition-colors"
                          onClick={async () => {
                            await groupsApi.deleteTag(group.id, t.id);
                            qc.invalidateQueries({
                              queryKey: ["tags", group.id],
                            });
                          }}
                          title="削除"
                        >
                          ×
                        </button>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      )}

      {/* Webhooks */}
      {perms.can_manage_webhook && (
        <Card>
          <CardContent className="p-5 space-y-5">
            <div className="flex items-center gap-2">
              <Webhook className="h-4 w-4 text-zinc-500" />
              <h3 className="text-sm font-semibold text-zinc-700">
                Discord Webhook
              </h3>
            </div>

            {(
              [
                {
                  type: "remind" as WebhookType,
                  icon: BellRing,
                  label: "リマインド通知",
                  desc: "毎朝8時に翌日期限のスケジュールを通知",
                },
                {
                  type: "created_log" as WebhookType,
                  icon: FileText,
                  label: "作成ログ通知",
                  desc: "スケジュール作成時に即時通知",
                },
              ] as const
            ).map(({ type, icon: Icon, label, desc }) => {
              const typeHooks = webhooks.filter((w) => w.webhook_type === type);
              return (
                <div key={type} className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Icon className="h-4 w-4 shrink-0 text-zinc-400" />
                      <div>
                        <p className="text-sm font-medium text-zinc-800">
                          {label}
                        </p>
                        <p className="text-xs text-zinc-400">{desc}</p>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => openWebhookDialog(type, null)}
                    >
                      <Plus className="h-3.5 w-3.5" /> 追加
                    </Button>
                  </div>

                  {typeHooks.length > 0 ? (
                    <ul className="space-y-1.5 pl-6">
                      {typeHooks.map((hook) => (
                        <li
                          key={hook.id}
                          className="flex items-center gap-3 rounded-lg border border-zinc-100 bg-zinc-50 px-3 py-2"
                        >
                          <span className="flex items-center gap-1 text-xs font-medium text-emerald-600 shrink-0">
                            <CheckCircle2 className="h-3.5 w-3.5" />
                          </span>
                          <span className="flex-1 min-w-0 text-sm text-zinc-700 truncate">
                            {hook.name || (
                              <span className="text-zinc-400 italic">
                                名前未設定
                              </span>
                            )}
                          </span>
                          <div className="flex shrink-0 items-center gap-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => openWebhookDialog(type, hook)}
                            >
                              編集
                            </Button>
                            <Button
                              size="icon-sm"
                              variant="ghost"
                              className="text-red-500 hover:bg-red-50"
                              onClick={() => handleWebhookDelete(hook)}
                              title="削除"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="pl-6 text-xs text-zinc-400 flex items-center gap-1">
                      <XCircle className="h-3.5 w-3.5" /> 未設定
                    </p>
                  )}
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* Webhook dialog */}
      <Dialog
        open={!!webhookDialog}
        onOpenChange={(o) => !o && setWebhookDialog(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {webhookDialog?.type === "remind"
                ? "リマインド通知"
                : "作成ログ通知"}{" "}
              Webhook を{webhookDialog?.id ? "編集" : "追加"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-1">
            <FormField label="Webhook名（任意）">
              <Input
                value={webhookName}
                onChange={(e) => setWebhookName(e.target.value)}
                placeholder="例: メインチャンネル"
                autoComplete="off"
              />
            </FormField>
            <FormField
              label={
                webhookDialog?.id
                  ? "Discord Webhook URL（変更する場合のみ入力）"
                  : "Discord Webhook URL"
              }
              hint="テスト送信を行い、URLの有効性を確認します"
            >
              <Input
                value={webhookUrl}
                onChange={(e) => setWebhookUrl(e.target.value)}
                placeholder="https://discord.com/api/webhooks/..."
                type="url"
                autoComplete="off"
              />
            </FormField>
            <p className="text-xs text-zinc-400 -mt-1">
              「チャンネルの編集」→「連携サービス」→「Webhookを作成」からURLを取得できます。
            </p>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setWebhookDialog(null)}>
                キャンセル
              </Button>
              <Button
                onClick={handleWebhookSave}
                loading={webhookSaving}
                disabled={!webhookDialog?.id ? !webhookUrl.trim() : false}
              >
                {webhookSaving
                  ? "テスト送信中…"
                  : webhookDialog?.id
                    ? "変更を保存"
                    : "登録する"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Danger zone */}
      {(isOwner || isMember) && (
        <Card className="border-red-200">
          <CardContent className="p-5 space-y-4">
            <h3 className="text-sm font-semibold text-red-700">危険な操作</h3>
            {isOwner ? (
              <div className="space-y-4">
                {/* Transfer ownership */}
                <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-4">
                  <p className="text-sm font-medium text-zinc-800 mb-1">オーナー移譲</p>
                  <p className="text-xs text-zinc-500 mb-3">
                    別のメンバーにオーナー権限を移譲します。移譲後はあなたはオーナーでなくなります。
                  </p>
                  <Dialog open={transferOpen} onOpenChange={setTransferOpen}>
                    <DialogTrigger asChild>
                      <Button size="sm" variant="outline">
                        <ArrowRightLeft className="h-4 w-4" /> オーナーを移譲
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>オーナーを移譲</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4 pt-1">
                        <p className="text-sm text-zinc-500">
                          新しいオーナーを選択してください。この操作は元に戻せません。
                        </p>
                        <FormField label="移譲先メンバー" required>
                          <select
                            value={transferUserId}
                            onChange={(e) => setTransferUserId(e.target.value)}
                            className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                          >
                            <option value="">選択してください</option>
                            {settingsMembers
                              .filter((m) => m.user.id !== group.owner.id)
                              .map((m) => (
                                <option key={m.user.id} value={m.user.id}>
                                  {m.user.nickname} (ID: {m.user.id.slice(0, 8)}…)
                                </option>
                              ))}
                          </select>
                        </FormField>
                        <div className="flex justify-end gap-2">
                          <Button variant="outline" onClick={() => setTransferOpen(false)}>
                            キャンセル
                          </Button>
                          <Button
                            variant="danger"
                            disabled={!transferUserId}
                            loading={transferLoading}
                            onClick={handleTransfer}
                          >
                            移譲する
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>

                {/* Delete group */}
                <div>
                  <p className="text-sm text-zinc-500 mb-3">
                    グループを削除すると、すべてのスケジュールとメンバーデータが完全に削除されます。
                  </p>
                  <Button
                    variant="danger"
                    loading={deleteLoading}
                    onClick={handleDeleteGroup}
                  >
                    <Trash2 className="h-4 w-4" /> グループを削除
                  </Button>
                </div>
              </div>
            ) : (
              <div>
                <p className="text-sm text-zinc-500 mb-3">
                  このグループを退出します。
                </p>
                <Button variant="danger-outline" onClick={handleLeave}>
                  <LogOut className="h-4 w-4" /> グループを退出
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function LeaveGroupButton({
  groupId,
  groupName,
}: {
  groupId: string;
  groupName: string;
}) {
  const { toast } = useToast();
  const router = useRouter();
  const qc = useQueryClient();

  const handleLeave = async () => {
    if (!confirm(`「${groupName}」を退出しますか？`)) return;
    try {
      await groupsApi.leave(groupId);
      qc.invalidateQueries({ queryKey: ["groups"] });
      router.push("/groups");
    } catch (err) {
      toast(extractApiError(err), "error");
    }
  };

  return (
    <Button variant="outline" size="sm" onClick={handleLeave}>
      <LogOut className="h-4 w-4" /> 退出
    </Button>
  );
}

function JoinGroupButton({
  groupId,
  isPrivate,
}: {
  groupId: string;
  isPrivate: boolean;
}) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [joining, setJoining] = useState(false);

  if (isPrivate) return null;

  const handleJoin = async () => {
    setJoining(true);
    try {
      await groupsApi.join(groupId);
      qc.invalidateQueries({ queryKey: ["my-permissions", groupId] });
      qc.invalidateQueries({ queryKey: ["group", groupId] });
      toast("参加リクエストを送りました！", "success");
    } catch (err) {
      toast(extractApiError(err), "error");
    } finally {
      setJoining(false);
    }
  };

  return (
    <Button size="sm" onClick={handleJoin} loading={joining}>
      <UserPlus className="h-4 w-4" /> グループに参加
    </Button>
  );
}
