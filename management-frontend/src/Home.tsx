import Header from '@/components/homeComponents/header';
import Content from '@/components/homeComponents/content';

export default function Home() {
    return (
        <div className="fixed inset-0 text-foreground bg-background font-sans selection:bg-yellow-500/30 transition-colors duration-300">
            <div className="h-full flex flex-col">
                <div className="shrink-0 w-full z-40">
                    <Header />
                </div>

                <div className="flex-1 flex min-h-0">
                    <Content />
                </div>
            </div>
        </div>
    );
}
