"use client";

import { useEffect, useState } from "react";
import api from "@/utils/api";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { motion } from "framer-motion";
import { UserCog, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import LinksRedesSociais from "@/components/LinksRedesSocias";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";

type Role = {
  id: number;
  name: string;
};

type User = {
  linkCadastro?: string;
  id: number;
  name: string;
  email: string;
  roleId?: number | null;
};

export default function AcessoPage() {
  const { user } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [newUserName, setNewUserName] = useState("");
  const [newUserEmail, setNewUserEmail] = useState("");
  const [newUserRole, setNewUserRole] = useState<number | null>(null);
  const [creating, setCreating] = useState(false);
  const [passwordModalUser, setPasswordModalUser] = useState<User | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [resettingPassword, setResettingPassword] = useState(false);
  const [emailModalUser, setEmailModalUser] = useState<User | null>(null);
  const [newEmail, setNewEmail] = useState("");
  const [updatingEmail, setUpdatingEmail] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const [usersRes, rolesRes] = await Promise.all([
          api.get("/users"),
          api.get("/roles"),
        ]);
        setUsers(usersRes.data);
        setRoles(rolesRes.data);
      } catch (err) {
        console.error(err);
        alert("Erro ao carregar dados de acesso");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleChangeRole = async (userId: number, newRoleId: number) => {
    try {
      await api.put(`/users/${userId}/role`, { roleId: newRoleId });
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, roleId: newRoleId } : u)),
      );
    } catch (err) {
      console.error(err);
      alert("Erro ao atribuir cargo ao usuário");
    }
  };

  const handleCreateUser = async () => {
    if (!newUserName || !newUserEmail || !newUserRole) {
      alert("Preencha todos os campos para criar o colaborador");
      return;
    }

    setCreating(true);
    try {
      const res = await api.post("/users", {
        nome: newUserName,
        email: newUserEmail,
        roleId: newUserRole,
      });

      // 🔗 gera o link pessoal automaticamente
      const linkCadastro = `${window.location.origin}/cliente/cadastro?consultorId=${res.data.id}`;
      const novoUser = { ...res.data, linkCadastro };

      setUsers((prev) => [...prev, novoUser]);
      setNewUserName("");
      setNewUserEmail("");
      setNewUserRole(null);
      alert("Colaborador criado com sucesso!");
    } catch (err) {
      console.error(err);
      alert("Erro ao criar colaborador");
    } finally {
      setCreating(false);
    }
  };

  const handleOpenPasswordModal = (target: User) => {
    setPasswordModalUser(target);
    setNewPassword("");
    setConfirmPassword("");
  };

  const handleOpenEmailModal = (target: User) => {
    setEmailModalUser(target);
    setNewEmail(target.email);
  };

  const handleResetPassword = async () => {
    if (!passwordModalUser) return;

    if (newPassword.trim().length < 6) {
      toast.error("A nova senha deve ter pelo menos 6 caracteres");
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("As senhas não coincidem");
      return;
    }

    setResettingPassword(true);
    try {
      await api.put(`/users/${passwordModalUser.id}/password`, {
        newPassword,
      });
      toast.success(
        `Senha de ${passwordModalUser.name || "colaborador"} atualizada`,
      );
      setPasswordModalUser(null);
    } catch (err) {
      console.error(err);
      toast.error("Não foi possível atualizar a senha");
    } finally {
      setResettingPassword(false);
    }
  };

  const handleUpdateEmail = async () => {
    if (!emailModalUser) return;

    if (!newEmail.trim()) {
      toast.error("Informe um e-mail válido");
      return;
    }

    setUpdatingEmail(true);
    try {
      await api.put(`/users/${emailModalUser.id}/email`, {
        email: newEmail.trim(),
      });

      setUsers((prev) =>
        prev.map((existing) =>
          existing.id === emailModalUser.id
            ? { ...existing, email: newEmail.trim() }
            : existing,
        ),
      );
      toast.success("E-mail atualizado com sucesso");
      setEmailModalUser(null);
    } catch (err) {
      console.error(err);
      toast.error("Não foi possível atualizar o e-mail");
    } finally {
      setUpdatingEmail(false);
    }
  };

  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [selectedLink, setSelectedLink] = useState<string | null>(null);

  const filteredUsers = users.filter(
    (u) =>
      u.name?.toLowerCase()?.includes(search.toLowerCase()) ||
      u.email?.toLowerCase()?.includes(search.toLowerCase()),
  );
  const isAdmin = user?.role?.name === "admin_master";

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64 text-gray-500 animate-pulse">
        Carregando dados...
      </div>
    );
  }

  return (
    <motion.div
      className="p-8 space-y-6"
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <UserCog className="w-6 h-6 text-primary" />
          <h1 className="text-3xl font-bold tracking-tight">
            Gerenciar Colaboradores
          </h1>
        </div>
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Buscar usuário..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8"
          />
        </div>
      </div>

      <Separator />

      {/* Criar novo colaborador */}
      <Card className="shadow-md">
        <CardHeader>
          <CardTitle>Criar Novo Colaborador</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <Input
            placeholder="Nome completo"
            value={newUserName}
            onChange={(e) => setNewUserName(e.target.value)}
          />
          <Input
            placeholder="E-mail"
            value={newUserEmail}
            onChange={(e) => setNewUserEmail(e.target.value)}
          />
          <Select
            value={newUserRole?.toString() || ""}
            onValueChange={(val) => setNewUserRole(Number(val))}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Selecione o cargo" />
            </SelectTrigger>
            <SelectContent>
              {roles.map((role) => (
                <SelectItem key={role.id} value={role.id.toString()}>
                  {role.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            onClick={handleCreateUser}
            className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold"
            disabled={creating}
          >
            {creating ? "Criando..." : "Criar Colaborador"}
          </Button>
        </CardContent>
      </Card>

      <Separator />

      {/* Tabela de usuários */}
      <Card className="shadow-md">
        <CardHeader>
          <CardTitle>Colaboradores e seus Cargos</CardTitle>
        </CardHeader>

        <CardContent>
          <ScrollArea className="h-[50vh]">
            <Table>
              <TableCaption>
                {filteredUsers.length > 0
                  ? "Lista completa de usuários cadastrados"
                  : "Nenhum usuário encontrado"}
              </TableCaption>

              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Cargo Atual</TableHead>
                  <TableHead>Alterar Cargo</TableHead>
                  {isAdmin && (
                    <TableHead className="text-right">Alterar Senha</TableHead>
                  )}
                  <TableHead className="text-right">Enviar Link</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {filteredUsers.map((user) => (
                  <motion.tr
                    key={user.id}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.15 }}
                    className="hover:bg-muted/40"
                  >
                    <TableCell className="font-medium">{user.name}</TableCell>
                    <TableCell className="text-gray-500">
                      {user.email}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleOpenEmailModal(user)}
                      >
                        Editar
                      </Button>
                    </TableCell>
                    <TableCell>
                      {user.roleId ? (
                        <Badge variant="secondary">
                          {roles.find((r) => r.id === user.roleId)?.name || "—"}
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-gray-500">
                          Sem cargo
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="flex w-full justify-end">
                      <Select
                        value={user.roleId?.toString() || ""}
                        onValueChange={(val) =>
                          handleChangeRole(user.id, Number(val))
                        }
                      >
                        <SelectTrigger className="w-44">
                          <SelectValue placeholder="Selecionar" />
                        </SelectTrigger>
                        <SelectContent>
                          {roles.map((role) => (
                            <SelectItem
                              key={role.id}
                              value={role.id.toString()}
                            >
                              {role.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    {isAdmin && (
                      <TableCell className="text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleOpenPasswordModal(user)}
                        >
                          Alterar
                        </Button>
                      </TableCell>
                    )}
                    <TableCell className="text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const link =
                            user.linkCadastro ||
                            `${window.location.origin}/cliente/cadastro?consultorId=${user.id}`;
                          setSelectedLink(link);
                          setShareModalOpen(true);
                        }}
                      >
                        Enviar
                      </Button>
                    </TableCell>
                  </motion.tr>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
      </Card>
      {isAdmin && (
        <Dialog
          open={!!emailModalUser}
          onOpenChange={(open) => {
            if (!open) setEmailModalUser(null);
          }}
        >
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Alterar e-mail do colaborador</DialogTitle>
              <DialogDescription>
                Atualize o e-mail de{" "}
                <span className="font-semibold">
                  {emailModalUser?.name || "o colaborador"}
                </span>
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label htmlFor="new-email">Novo e-mail</Label>
                <Input
                  id="new-email"
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="colaborador@empresa.com"
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setEmailModalUser(null)}
                disabled={updatingEmail}
              >
                Cancelar
              </Button>
              <Button onClick={handleUpdateEmail} disabled={updatingEmail}>
                {updatingEmail ? "Atualizando..." : "Salvar"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
      {isAdmin && (
        <Dialog
          open={!!passwordModalUser}
          onOpenChange={(open) => {
            if (!open) setPasswordModalUser(null);
          }}
        >
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Alterar senha do colaborador</DialogTitle>
              <DialogDescription>
                Defina uma nova senha para{" "}
                <span className="font-semibold">
                  {passwordModalUser?.name || "o colaborador"}
                </span>
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label htmlFor="new-password">Nova senha</Label>
                <Input
                  id="new-password"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm-password">Confirmar senha</Label>
                <Input
                  id="confirm-password"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repita a nova senha"
                />
              </div>
              <p className="text-sm text-muted-foreground">
                A nova senha deve conter no mínimo 6 caracteres. Compartilhe com
                o colaborador após salvar.
              </p>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setPasswordModalUser(null)}
                disabled={resettingPassword}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleResetPassword}
                disabled={resettingPassword}
              >
                {resettingPassword ? "Salvando..." : "Salvar nova senha"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
      {selectedLink && (
        <LinksRedesSociais
          link={selectedLink}
          open={shareModalOpen}
          onClose={() => setShareModalOpen(false)}
        />
      )}
    </motion.div>
  );
}
