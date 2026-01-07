"use client";

import { useState, useRef, useEffect } from "react";
import { ConversationList } from "@/components/messages/conversation-list";
import { ChatWindow } from "@/components/messages/chat-window";
import { PatientSidebar } from "@/components/messages/patient-sidebar";
import type { Conversation } from "@/types";

export default function MessagesPage() {
    const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [isListOpen, setIsListOpen] = useState(true);

    return (
        <div className="h-screen flex overflow-hidden bg-gradient-to-br from-blue-50 via-white to-gray-50 relative">
            {/* Lista de Conversas */}
            <div
                className={`flex-shrink-0 border-r border-blue-200 bg-white transition-all duration-300 ease-in-out ${isListOpen ? "w-80 opacity-100" : "w-0 opacity-0 overflow-hidden border-r-0"
                    }`}
            >
                <ConversationList
                    selectedId={selectedConversation?.id}
                    onSelectConversation={setSelectedConversation}
                    selectedConversation={selectedConversation}
                />
            </div>

            <div className="flex-1 flex flex-col min-w-0">
                <ChatWindow
                    conversation={selectedConversation}
                    onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
                    isSidebarOpen={isSidebarOpen}
                    onToggleList={() => setIsListOpen(!isListOpen)}
                    isListOpen={isListOpen}
                />
            </div>

            {/* Sidebar de Detalhes do Paciente */}
            {selectedConversation && isSidebarOpen && (
                <div
                    className="w-80 border-l border-blue-200 bg-white flex-shrink-0 transition-all duration-300 ease-in-out"
                >
                    <PatientSidebar conversation={selectedConversation} />
                </div>
            )}
        </div>
    );
}
