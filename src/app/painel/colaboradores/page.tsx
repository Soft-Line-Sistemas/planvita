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

type Role = {
  id: number;
  name: string;
};

type User = {
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

  useEffect(() => {
    const load = async () => {
      try {
        const [usersRes, rolesRes] = await Promise.all([
          api.get("/api/v1/users"),
          api.get("/api/v1/roles"),
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
      await api.put(`/api/v1/users/${userId}/role`, { roleId: newRoleId });
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, roleId: newRoleId } : u)),
      );
    } catch (err) {
      console.error(err);
      alert("Erro ao atribuir cargo ao usuário");
    }
  };

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

      {/* Tabela */}
      <Card className="shadow-md">
        <CardHeader>
          <CardTitle>Colaboradores e seus Cargos</CardTitle>
        </CardHeader>

        <CardContent>
          <ScrollArea className="h-[70vh]">
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
                  <TableHead className="text-right">Alterar Cargo</TableHead>
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
                  </motion.tr>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
      </Card>
    </motion.div>
  );
}
