"use client";

import { FormEvent, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import api from "@/utils/api";
import { toast } from "sonner";
import { ShieldCheck, KeyRound } from "lucide-react";

export default function ContaPage() {
  const { user, loading } = useAuth();
  const [formState, setFormState] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (field: keyof typeof formState) => (value: string) => {
    setFormState((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!user) return;

    if (!formState.currentPassword.trim()) {
      toast.error("Informe sua senha atual");
      return;
    }

    if (formState.newPassword.trim().length < 6) {
      toast.error("A nova senha deve ter pelo menos 6 caracteres");
      return;
    }

    if (formState.newPassword !== formState.confirmPassword) {
      toast.error("A confirmação precisa ser igual à nova senha");
      return;
    }

    setIsSubmitting(true);

    try {
      await api.put(`/users/${user.id}/password`, {
        currentPassword: formState.currentPassword,
        newPassword: formState.newPassword,
      });

      toast.success("Senha atualizada com sucesso");
      setFormState({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } catch (error) {
      console.error(error);
      toast.error("Não foi possível atualizar sua senha");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 text-muted-foreground">Carregando informações...</div>
    );
  }

  if (!user) {
    return (
      <div className="p-8 text-muted-foreground">
        Não foi possível carregar seus dados. Faça login novamente.
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6">
      <div className="space-y-1">
        <div className="flex items-center gap-3">
          <KeyRound className="h-7 w-7 text-primary" />
          <h1 className="text-3xl font-bold tracking-tight">Minha Conta</h1>
        </div>
        <p className="text-muted-foreground">
          Atualize sua senha e mantenha seu acesso em segurança.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Dados do usuário</CardTitle>
            <CardDescription>
              Informações básicas do seu acesso no Planvita.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div>
              <p className="text-muted-foreground">Nome</p>
              <p className="font-medium">{user.nome}</p>
            </div>
            <div>
              <p className="text-muted-foreground">E-mail</p>
              <p className="font-medium">{user.email}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Perfil</p>
              <p className="font-medium">{user.role?.name || "—"}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Tenant</p>
              <p className="font-medium uppercase">{user.tenant}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-green-600" />
              Boas práticas de segurança
            </CardTitle>
            <CardDescription>
              Algumas dicas rápidas para sua senha:
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>• Utilize letras maiúsculas, minúsculas e números.</p>
            <p>• Evite datas ou nomes fáceis de identificar.</p>
            <p>• Troque a senha periodicamente.</p>
            <p>• Não reutilize senhas de outros sistemas.</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Alterar senha</CardTitle>
          <CardDescription>
            Informe sua senha atual e defina uma nova senha segura.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-5" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <Label htmlFor="current-password">Senha atual</Label>
              <Input
                id="current-password"
                type="password"
                value={formState.currentPassword}
                onChange={(event) =>
                  handleChange("currentPassword")(event.target.value)
                }
                placeholder="Digite sua senha atual"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-password">Nova senha</Label>
              <Input
                id="new-password"
                type="password"
                value={formState.newPassword}
                onChange={(event) =>
                  handleChange("newPassword")(event.target.value)
                }
                placeholder="Crie uma nova senha"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirmar nova senha</Label>
              <Input
                id="confirm-password"
                type="password"
                value={formState.confirmPassword}
                onChange={(event) =>
                  handleChange("confirmPassword")(event.target.value)
                }
                placeholder="Repita a nova senha"
                required
              />
            </div>
            <div className="flex items-center justify-end gap-3">
              <Button
                type="submit"
                className="min-w-48"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Atualizando..." : "Atualizar senha"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
