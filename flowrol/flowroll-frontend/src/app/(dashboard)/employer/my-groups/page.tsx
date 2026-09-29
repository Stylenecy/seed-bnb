import GroupSection from "@/components/employer/GroupSection";

export default function MyGroups() {
    return (
        <div className="min-h-screen bg-slate-50 dark:bg-[#070b14] transition-colors duration-500 pt-8 pb-20 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto space-y-8">

                <GroupSection />
            </div>
        </div>
    );
}