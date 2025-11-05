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

type Role = {
  id: number;
  name: string;
};

type User = {
  linkCadastro: string;
  id: number;
  name: string;
  email: string;
  roleId?: number | null;
};

export default function AcessoPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [newUserName, setNewUserName] = useState("");
  const [newUserEmail, setNewUserEmail] = useState("");
  const [newUserRole, setNewUserRole] = useState<number | null>(null);
  const [creating, setCreating] = useState(false);

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
      const linkCadastro = `${window.location.origin}/painel/cliente/cadastro?consultorId=${res.data.id}`;
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

  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [selectedLink, setSelectedLink] = useState<string | null>(null);

  const filteredUsers = users.filter(
    (u) =>
      u.name?.toLowerCase()?.includes(search.toLowerCase()) ||
      u.email?.toLowerCase()?.includes(search.toLowerCase()),
  );

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
                    <TableCell className="text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const link =
                            user.linkCadastro ||
                            `${window.location.origin}/painel/cliente/cadastro?consultorId=${user.id}`;
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
