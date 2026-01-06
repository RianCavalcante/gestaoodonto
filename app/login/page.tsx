"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { Smile, Mail, Lock, Loader2 } from "lucide-react";

export default function LoginPage() {
    const router = useRouter();
    const supabase = createClient();
    const [isSignUp, setIsSignUp] = useState(false);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            let errorResult;

            if (isSignUp) {
                const { error } = await supabase.auth.signUp({
                    email,
                    password,
                });
                errorResult = error;
                if (!error) {
                    // Auto login after signup might require email confirmation depending on settings
                    // For dev/mock usually fine, but let's inform user
                    alert("Conta criada! Tente fazer login agora.");
                    setIsSignUp(false);
                    setLoading(false);
                    return;
                }
            } else {
                const { error } = await supabase.auth.signInWithPassword({
                    email,
                    password,
                });
                errorResult = error;
            }

            if (errorResult) {
                setError(errorResult.message);
            } else {
                router.push("/dashboard");
                router.refresh();
            }
        } catch (err) {
            setError("Erro ao processar solicitação. Tente novamente.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-blue-100 p-4">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-200/40 via-transparent to-transparent"></div>

            <Card className="w-full max-w-md relative z-10 animate-in border-blue-200 shadow-xl">
                <CardHeader className="space-y-4 text-center">
                    <div className="flex justify-center">
                        <div className="p-4 rounded-full bg-gradient-to-br from-blue-600 to-blue-400 shadow-lg shadow-blue-500/30">
                            <Smile className="w-10 h-10 text-white" />
                        </div>
                    </div>
                    <div>
                        <CardTitle className="text-3xl font-bold text-gradient">
                            GestãoOdonto
                        </CardTitle>
                        <CardDescription className="text-base mt-2">
                            {isSignUp ? "Crie sua conta para começar" : "Sistema de gestão para clínicas odontológicas"}
                        </CardDescription>
                    </div>
                </CardHeader>

                <CardContent>
                    <form onSubmit={handleAuth} className="space-y-4">
                        {error && (
                            <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
                                {error}
                            </div>
                        )}

                        <div className="space-y-2">
                            <label htmlFor="email" className="text-sm font-medium">
                                Email
                            </label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="seu@email.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="pl-10"
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label htmlFor="password" className="text-sm font-medium">
                                Senha
                            </label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                <Input
                                    id="password"
                                    type="password"
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="pl-10"
                                    required
                                />
                            </div>
                        </div>

                        <Button
                            type="submit"
                            className="w-full"
                            variant="gradient"
                            disabled={loading}
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    {isSignUp ? "Criando conta..." : "Entrando..."}
                                </>
                            ) : (
                                isSignUp ? "Criar Conta" : "Entrar"
                            )}
                        </Button>
                    </form>

                    <div className="mt-6 text-center text-sm">
                        <p className="text-muted-foreground">
                            {isSignUp ? "Já tem uma conta?" : "Ainda não tem conta?"}
                        </p>
                        <Button
                            variant="link"
                            className="text-blue-600 font-semibold p-0 h-auto"
                            onClick={() => setIsSignUp(!isSignUp)}
                        >
                            {isSignUp ? "Faça Login" : "Cadastre-se agora"}
                        </Button>
                    </div>

                    {!isSignUp && (
                        <div className="mt-6 text-center text-sm text-muted-foreground opacity-70">
                            <p>Credenciais demo:</p>
                            <p className="font-mono text-xs mt-1">
                                admin@gestaoodonto.com / demo123 (Se cadastrado)
                            </p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
