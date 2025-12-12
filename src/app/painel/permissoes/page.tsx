"use client";

import { useEffect, useMemo, useState } from "react";
import api from "@/utils/api";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { motion } from "framer-motion";
import { Shield, PlusCircle } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

type Role = {
  id?: number;
  name: string;
  permissions: number[];
};

type Permission = {
  id: number;
  name: string;
  description: string;
};

export default function RolesPermissionsPage() {
  const { hasPermission } = useAuth();
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [newRoleName, setNewRoleName] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!hasPermission("role.view")) {
      setLoading(false);
      return;
    }
    const fetchData = async () => {
      try {
        const [rolesRes, permRes] = await Promise.all([
          api.get("/roles"),
          api.get("/permissions"),
        ]);
        setRoles(rolesRes.data);
        setPermissions(permRes.data);
      } catch (err) {
        console.error(err);
        alert("Erro ao carregar roles e permissions");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [hasPermission]);

  const canCreateRole = useMemo(
    () => hasPermission("role.create"),
    [hasPermission],
  );
  const canUpdateRole = useMemo(
    () => hasPermission("role.update"),
    [hasPermission],
  );

  const groupedPermissions = useMemo(() => {
    return permissions.reduce<Record<string, Permission[]>>((groups, perm) => {
      const moduleKey = perm.name.split(".")[0] || "geral";
      if (!groups[moduleKey]) groups[moduleKey] = [];
      groups[moduleKey].push(perm);
      return groups;
    }, {});
  }, [permissions]);

  const sortedModules = useMemo(
    () => Object.keys(groupedPermissions).sort((a, b) => a.localeCompare(b)),
    [groupedPermissions],
  );

  const handleCreateRole = async () => {
    if (!canCreateRole) return;
    if (!newRoleName.trim()) return;
    setSaving(true);
    try {
      const res = await api.post("/roles", { name: newRoleName });
      setRoles([...roles, res.data]);
      setNewRoleName("");
    } catch (err) {
      console.error(err);
      alert("Erro ao criar cargo");
    } finally {
      setSaving(false);
    }
  };

  const updateRolePermissions = async (
    roleId: number,
    permissionIds: number[],
  ) => {
    if (!canUpdateRole) return;
    try {
      await api.put(`/roles/${roleId}/permissions`, { permissionIds });
      setRoles((prev) =>
        prev.map((r) =>
          r.id === roleId ? { ...r, permissions: permissionIds } : r,
        ),
      );
    } catch (err) {
      console.error(err);
      alert("Erro ao atualizar permissões");
    }
  };

  const handleTogglePermission = async (
    roleId: number,
    permissionId: number,
  ) => {
    const role = roles.find((r) => r.id === roleId);
    if (!role) return;

    const currentPermissions = role.permissions ?? [];

    const updatedPermissions = currentPermissions.includes(permissionId)
      ? currentPermissions.filter((p) => p !== permissionId)
      : [...currentPermissions, permissionId];

    updateRolePermissions(roleId, updatedPermissions);
  };

  const handleToggleModule = async (
    roleId: number,
    moduleKey: string,
    shouldCheck: boolean,
  ) => {
    const role = roles.find((r) => r.id === roleId);
    if (!role) return;

    const modulePermissions = groupedPermissions[moduleKey] ?? [];
    const modulePermissionIds = modulePermissions.map((perm) => perm.id);
    if (modulePermissionIds.length === 0) return;

    const currentPermissions = role.permissions ?? [];
    const updatedPermissions = shouldCheck
      ? Array.from(new Set([...currentPermissions, ...modulePermissionIds]))
      : currentPermissions.filter((p) => !modulePermissionIds.includes(p));

    updateRolePermissions(roleId, updatedPermissions);
  };

  const formatModuleName = (moduleKey: string) =>
    moduleKey
      .replace(/[_-]/g, " ")
      .split(" ")
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(" ");

  const getModuleCheckedState = (role: Role, moduleKey: string) => {
    const modulePermissions = groupedPermissions[moduleKey] ?? [];
    const assignedCount = modulePermissions.filter((perm) =>
      role.permissions?.includes(perm.id),
    ).length;

    if (assignedCount === 0) return false;
    if (assignedCount === modulePermissions.length) return true;
    return "indeterminate";
  };

  if (loading)
    return (
      <div className="flex justify-center items-center h-64 text-muted-foreground animate-pulse">
        Carregando dados...
      </div>
    );

  if (!hasPermission("role.view")) {
    return (
      <div className="p-8">
        <Card>
          <CardHeader>
            <CardTitle>Sem permissão</CardTitle>
          </CardHeader>
          <CardContent>
            Você não pode visualizar ou gerenciar permissões.
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <motion.div
      className="p-8 space-y-8"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <Shield className="w-6 h-6 text-primary" />
          <h1 className="text-3xl font-bold tracking-tight">
            Gerenciar Permissões
          </h1>
        </div>
      </div>

      <Separator />

      {/* Criar nova Role */}
      <Card className="shadow-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PlusCircle className="w-5 h-5 text-primary" />
            Criar Novo Cargo
          </CardTitle>
          <CardDescription>
            Defina um nome para o novo cargo do sistema.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col sm:flex-row gap-4 items-end">
          <div className="flex-1 w-full">
            <Label>Nome do Cargo</Label>
            <Input
              type="text"
              value={newRoleName}
              onChange={(e) => setNewRoleName(e.target.value)}
              placeholder="Ex: Administrador, Gestor, Financeiro..."
              disabled={!canCreateRole}
            />
          </div>
          <Button
            onClick={handleCreateRole}
            disabled={saving || !canCreateRole}
          >
            {saving ? "Salvando..." : "Criar Cargo"}
          </Button>
        </CardContent>
      </Card>

      {/* Lista de Roles */}
      <ScrollArea className="h-[70vh]">
        <div className="space-y-6">
          {roles.map((role) => (
            <motion.div
              key={role.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
            >
              <Card className="shadow-sm hover:shadow-lg transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>{role.name}</CardTitle>
                    <CardDescription>
                      {role.permissions?.length > 0 ? (
                        <span>
                          {role.permissions?.length} permissões atribuídas
                        </span>
                      ) : (
                        <span className="text-muted-foreground">
                          Nenhuma permissão atribuída
                        </span>
                      )}
                    </CardDescription>
                  </div>

                  <Badge variant="outline" className="text-xs px-2 py-1">
                    ID: {role.id}
                  </Badge>
                </CardHeader>

                <CardContent className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  <div className="sm:col-span-2 md:col-span-3">
                    <Accordion
                      type="multiple"
                      className="divide-y rounded-lg border"
                    >
                      {sortedModules.map((moduleKey) => {
                        const modulePermissions = groupedPermissions[moduleKey];
                        const checkedState = getModuleCheckedState(
                          role,
                          moduleKey,
                        );
                        const assignedCount = modulePermissions.filter((perm) =>
                          role.permissions?.includes(perm.id),
                        ).length;

                        return (
                          <AccordionItem key={moduleKey} value={moduleKey}>
                            <div className="flex items-center gap-3 px-4">
                              <Checkbox
                                checked={checkedState}
                                disabled={!canUpdateRole}
                                onCheckedChange={(state) =>
                                  handleToggleModule(
                                    role.id!,
                                    moduleKey,
                                    state === true,
                                  )
                                }
                              />
                              <AccordionTrigger className="flex-1 px-0">
                                <div className="flex flex-1 items-center justify-between gap-3">
                                  <div className="flex flex-col">
                                    <span className="font-semibold leading-none">
                                      {formatModuleName(moduleKey)}
                                    </span>
                                    <span className="text-xs text-muted-foreground">
                                      {assignedCount}/{modulePermissions.length}{" "}
                                      permissões
                                    </span>
                                  </div>
                                  <Badge
                                    variant={
                                      checkedState === true
                                        ? "default"
                                        : "outline"
                                    }
                                    className="text-[11px]"
                                  >
                                    {checkedState === true
                                      ? "Tudo selecionado"
                                      : checkedState === "indeterminate"
                                        ? "Parcial"
                                        : "Nenhuma"}
                                  </Badge>
                                </div>
                              </AccordionTrigger>
                            </div>
                            <AccordionContent className="px-4">
                              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                                {modulePermissions.map((perm) => {
                                  const checked = role.permissions?.includes(
                                    perm.id,
                                  );
                                  return (
                                    <div
                                      key={perm.id}
                                      className="flex items-center space-x-2 rounded-md border p-2 hover:bg-muted/50 transition"
                                    >
                                      <Checkbox
                                        checked={checked}
                                        disabled={!canUpdateRole}
                                        onCheckedChange={() =>
                                          handleTogglePermission(
                                            role.id!,
                                            perm.id,
                                          )
                                        }
                                      />
                                      <div className="flex flex-col gap-0.5">
                                        <Label className="text-sm leading-tight">
                                          {perm.description}
                                        </Label>
                                        <span className="text-[11px] text-muted-foreground">
                                          {perm.name}
                                        </span>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </AccordionContent>
                          </AccordionItem>
                        );
                      })}
                    </Accordion>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </ScrollArea>
    </motion.div>
  );
}
