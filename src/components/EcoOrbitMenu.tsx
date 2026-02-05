import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Zap, MessageSquare, Bot, Plus, X, ChevronUp, Code2 } from 'lucide-react';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import EcoAssistant from './EcoAssistant';
import { GreenCodeRefiner } from './GreenCodeRefiner';
import { cn } from '@/lib/utils';
import { useUI } from '@/context/UIContext';

export const EcoOrbitMenu = () => {
    const [isOpen, setIsOpen] = useState(false);
    const { activeAgentView, setActiveAgentView, openAgent, openSupportBot, closeAll } = useUI();

    return (
        <>
            {/* The Floating Button */}
            <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">

                {isOpen && (
                    <div className="flex flex-col items-end gap-3 animate-in fade-in slide-in-from-bottom-4 duration-200">
                        {/* Agent Option */}
                        <div className="flex items-center gap-3">
                            <span className="text-sm font-medium bg-background border shadow-sm px-3 py-1.5 rounded-lg text-muted-foreground whitespace-nowrap">
                                AI Code Refiner
                            </span>
                            <Button
                                size="icon"
                                className="h-12 w-12 rounded-full bg-purple-600 hover:bg-purple-700 shadow-lg"
                                onClick={() => { setIsOpen(false); openAgent(); }}
                            >
                                <Code2 className="h-5 w-5" />
                            </Button>
                        </div>

                        {/* Chat Option */}
                        <div className="flex items-center gap-3">
                            <span className="text-sm font-medium bg-background border shadow-sm px-3 py-1.5 rounded-lg text-muted-foreground whitespace-nowrap">
                                Live Help Chat
                            </span>
                            <Button
                                size="icon"
                                className="h-12 w-12 rounded-full bg-primary hover:bg-primary/90 shadow-lg"
                                onClick={() => { setIsOpen(false); openSupportBot(); }}
                            >
                                <Bot className="h-5 w-5" />
                            </Button>
                        </div>
                    </div>
                )}

                {/* Main Toggle */}
                <Button
                    size="icon"
                    className={cn(
                        "h-14 w-14 rounded-full shadow-xl transition-transform duration-300",
                        isOpen ? "rotate-45" : "rotate-0",
                        "bg-foreground text-background hover:bg-foreground/90"
                    )}
                    onClick={() => setIsOpen(!isOpen)}
                >
                    <Plus className="h-6 w-6" />
                </Button>
            </div>

            {/* Chat Sheet */}
            <Sheet open={activeAgentView === 'chat'} onOpenChange={(open) => !open && closeAll()}>
                <SheetContent side="right" className="w-[400px] sm:w-[500px] p-0 border-l border-border/50">
                    <EcoAssistant />
                </SheetContent>
            </Sheet>

            {/* Agent Dialog */}
            <Dialog open={activeAgentView === 'agent'} onOpenChange={(open) => !open && closeAll()}>
                <DialogContent className="max-w-4xl h-[80vh] flex flex-col p-0 gap-0 overflow-hidden bg-background/95 backdrop-blur-md border-border/50">
                    <GreenCodeRefiner />
                </DialogContent>
            </Dialog>
        </>
    );
};
