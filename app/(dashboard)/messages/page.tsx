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

    // Resizing State
    const [leftSidebarWidth, setLeftSidebarWidth] = useState(320);
    const [rightSidebarWidth, setRightSidebarWidth] = useState(320);
    const [isResizing, setIsResizing] = useState(false); // New state to control transitions
    const isResizingLeft = useRef(false);
    const isResizingRight = useRef(false);

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (isResizingLeft.current) {
                const newWidth = e.clientX;
                if (newWidth > 200 && newWidth < 800) { // Limit max width
                    setLeftSidebarWidth(newWidth);
                }
            } else if (isResizingRight.current) {
                // Right width is tricky because it's from the right edge
                // Width = Total Window Width - Mouse X
                const newWidth = window.innerWidth - e.clientX;
                if (newWidth > 200 && newWidth < 800) {
                    setRightSidebarWidth(newWidth);
                }
            }
        };

        const handleMouseUp = () => {
            if (isResizingLeft.current || isResizingRight.current) {
                isResizingLeft.current = false;
                isResizingRight.current = false;
                setIsResizing(false); // Re-enable transitions
                document.body.style.cursor = 'default';
                document.body.classList.remove('select-none'); // Unlock text selection
            }
        };

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);

        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };
    }, []);

    const startResizingLeft = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        isResizingLeft.current = true;
        setIsResizing(true); // Disable transitions
        document.body.style.cursor = 'col-resize';
        document.body.classList.add('select-none'); // Prevent text selection
    };

    const startResizingRight = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        isResizingRight.current = true;
        setIsResizing(true); // Disable transitions
        document.body.style.cursor = 'col-resize';
        document.body.classList.add('select-none'); // Prevent text selection
    };

    return (
        <div className="h-screen flex overflow-hidden bg-gradient-to-br from-blue-50 via-white to-gray-50 relative">
            {/* Global Resize Overlay - Active only when resizing */}
            {isResizing && (
                <div
                    className="fixed inset-0 z-50 cursor-col-resize bg-transparent select-none"
                // Force event capture by high z-index
                />
            )}

            {/* Lista de Conversas */}
            <div
                style={{ width: isListOpen ? leftSidebarWidth : 0 }}
                className={`border-r border-blue-200 bg-white flex-shrink-0 relative ${isListOpen && !isResizing ? "transition-all duration-300 ease-in-out" : ""
                    } ${!isListOpen && "overflow-hidden border-r-0 transition-all duration-300 ease-in-out"
                    }`}
            >
                <ConversationList
                    selectedId={selectedConversation?.id}
                    onSelectConversation={setSelectedConversation}
                />

                {/* Resizer Handle Left - Larger Hit Area */}
                {isListOpen && (
                    <div
                        onMouseDown={startResizingLeft}
                        className="absolute top-0 -right-1.5 w-4 h-full cursor-col-resize z-20 hover:bg-blue-400/20 active:bg-blue-600/30 transition-colors"
                    >
                        {/* Visual Indicator Line (Centered in the 16px hit area) */}
                        <div className="absolute top-0 left-1/2 w-[1px] h-full bg-transparent group-hover:bg-blue-400 active:bg-blue-600"></div>
                    </div>
                )}
            </div>

            {/* Janela de Chat */}
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
                    style={{ width: rightSidebarWidth }}
                    className={`border-l border-blue-200 bg-white flex-shrink-0 relative ${!isResizing ? "transition-all duration-300 ease-in-out" : ""
                        }`}
                >
                    {/* Resizer Handle Right - Larger Hit Area */}
                    <div
                        onMouseDown={startResizingRight}
                        className="absolute top-0 -left-1.5 w-4 h-full cursor-col-resize z-20 hover:bg-blue-400/20 active:bg-blue-600/30 transition-colors"
                    >
                        {/* Visual Indicator Line */}
                        <div className="absolute top-0 left-1/2 w-[1px] h-full bg-transparent group-hover:bg-blue-400 active:bg-blue-600"></div>
                    </div>

                    <PatientSidebar conversation={selectedConversation} />
                </div>
            )}
        </div>
    );
}
