"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle, CheckCircle2, Loader2, QrCode } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { QRCodeSVG } from "qrcode.react";
import { io } from "socket.io-client";
import { toast } from "sonner";

export default function WhatsAppSettingsPage() {
    const [status, setStatus] = useState<string>("checking"); // checking, disconnected, qr_ready, connected, authenticated, server_error
    const [qrCode, setQrCode] = useState<string | null>(null);
    const [socket, setSocket] = useState<any>(null);
    const serverUrl = process.env.NEXT_PUBLIC_WHATSAPP_SERVER_URL || "http://localhost:3001";

    useEffect(() => {
        // Conectar ao servidor dedicado de WhatsApp
        // Importante: Certifique-se que o backend/whatsapp/server.js está rodando na porta 3001
        const newSocket = io(serverUrl);
        setSocket(newSocket);

        newSocket.on("connect", () => {
            console.log("Conectado ao servidor WhatsApp");
            // Pedir status inicial
            fetch(`${serverUrl}/status`)
                .then(res => res.json())
                .then(data => {
                    setStatus(data.status);
                    setQrCode(data.qr);
                })
                .catch(() => setStatus("server_error"));
        });

        newSocket.on("connect_error", () => {
            console.error("Erro de conexão com Socket.IO");
            setStatus("server_error");
        });

        newSocket.on("whatsapp_status", (newStatus: string) => {
            console.log("Status update:", newStatus);
            setStatus(newStatus);
            if (newStatus === "connected" || newStatus === "authenticated") {
                setQrCode(null);
                toast.success("WhatsApp Conectado!");
            }
        });

        newSocket.on("whatsapp_qr", (qr: string) => {
            console.log("QR received");
            setQrCode(qr);
            setStatus("qr_ready");
        });

        return () => {
            newSocket.disconnect();
        };
    }, [serverUrl]);

    useEffect(() => {
        let intervalId: ReturnType<typeof setInterval> | null = null;

        if (status !== "connected" && status !== "authenticated" && status !== "server_error") {
            intervalId = setInterval(() => {
                fetch(`${serverUrl}/status`)
                    .then(res => res.json())
                    .then(data => {
                        setStatus(data.status);
                        setQrCode(data.qr);
                    })
                    .catch(() => setStatus("server_error"));
            }, 2000);
        }

        return () => {
            if (intervalId) clearInterval(intervalId);
        };
    }, [serverUrl, status]);

    const initializeWhatsApp = async () => {
        try {
            await fetch(`${serverUrl}/init`, { method: "POST" });
            toast.info("Iniciando WhatsApp... Aguarde o QR Code.");
        } catch (error) {
            toast.error("Erro ao iniciar WhatsApp. Verifique o servidor.");
        }
    };

    const logoutWhatsApp = async () => {
        try {
            await fetch(`${serverUrl}/logout`, { method: "POST" });
            toast.success("Comando de logout enviado.");
        } catch (error) {
            toast.error("Erro ao desconectar.");
        }
    };

    return (
        <div className="p-6 space-y-6 max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold tracking-tight text-gray-900">Configuração WhatsApp</h1>

            {status === "server_error" && (
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Servidor Offline</AlertTitle>
                    <AlertDescription>
                        O microserviço de WhatsApp não está respondendo em {serverUrl}. <br />
                        Verifique se você iniciou o servidor com <code>node backend/whatsapp/server.js</code>.
                    </AlertDescription>
                </Alert>
            )}

            <div className="grid gap-6 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <QrCode className="w-5 h-5" />
                            Conexão
                        </CardTitle>
                        <CardDescription>Escaneie o QR Code para conectar seu WhatsApp</CardDescription>
                    </CardHeader>
                    <CardContent className="flex flex-col items-center justify-center min-h-[300px] space-y-4">
                        {status === "checking" ? (
                            <div className="flex flex-col items-center gap-2">
                                <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                                <span className="text-sm text-gray-500">Verificando serviço...</span>
                            </div>
                        ) : (status === "connected" || status === "authenticated") ? (
                            <div className="flex flex-col items-center gap-4 text-center">
                                <div className="h-20 w-20 bg-green-100 rounded-full flex items-center justify-center">
                                    <CheckCircle2 className="h-10 w-10 text-green-600" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-lg text-green-700">Conectado!</h3>
                                    <p className="text-sm text-gray-500">Seu WhatsApp está sincronizado.</p>
                                </div>
                                <Button variant="outline" className="text-red-500 hover:text-red-700 hover:bg-red-50" onClick={logoutWhatsApp}>
                                    Desconectar
                                </Button>
                            </div>
                        ) : (status === "qr_ready" && qrCode) ? (
                            <div className="flex flex-col items-center gap-4">
                                <div className="p-4 bg-white border-2 border-gray-100 rounded-lg shadow-sm">
                                    <QRCodeSVG value={qrCode} size={256} />
                                </div>
                                <p className="text-sm text-gray-500 animate-pulse">Aguardando leitura do QR Code...</p>
                                <Button variant="outline" size="sm" onClick={initializeWhatsApp}>
                                    Gerar Novo QR Code
                                </Button>
                            </div>
                        ) : (status === "disconnected" || status === "auth_failure" || status === "server_error" || status === "identifying") ? (
                            <div className="flex flex-col items-center gap-4">
                                <div className="h-32 w-32 bg-gray-100 rounded-full flex items-center justify-center mb-2">
                                    {status === 'identifying' ? (
                                        <Loader2 className="h-12 w-12 text-blue-500 animate-spin" />
                                    ) : (
                                        <QrCode className="h-12 w-12 text-gray-400" />
                                    )}
                                </div>
                                <Button onClick={initializeWhatsApp} className="w-full" disabled={status === "server_error" || status === "identifying"}>
                                    {status === 'identifying' ? 'Gerando QR Code...' : 'Gerar QR Code'}
                                </Button>
                            </div>
                        ) : null}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Status do Serviço</CardTitle>
                        <CardDescription>Monitoramento do servidor dedicado</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <span className="text-sm font-medium">Status da Conexão</span>
                            <span className={`px-2 py-1 rounded text-xs font-semibold uppercase ${status === 'connected' || status === 'authenticated' ? 'bg-green-100 text-green-700' :
                                status === 'qr_ready' ? 'bg-yellow-100 text-yellow-700' :
                                    status === 'server_error' ? 'bg-red-100 text-red-700' :
                                        'bg-gray-200 text-gray-700'
                                }`}>
                                {status === 'authenticated' ? 'CONNECTED' : status}
                            </span>
                        </div>
                        <div className="text-xs text-gray-500">
                            <p>O servidor backend roda na porta 3001.</p>
                            <p className="mt-2">Mantenha esta aba aberta durante a sincronização.</p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
