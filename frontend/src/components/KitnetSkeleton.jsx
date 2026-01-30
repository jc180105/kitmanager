function KitnetSkeleton() {
    return (
        <article className="bg-slate-800/50 rounded-2xl p-5 border border-slate-700/50 animate-pulse">
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-slate-700 rounded-xl"></div>
                    <div>
                        <div className="h-5 w-24 bg-slate-700 rounded mb-2"></div>
                        <div className="h-4 w-16 bg-slate-700 rounded"></div>
                    </div>
                </div>
                <div className="h-6 w-20 bg-slate-700 rounded-full"></div>
            </div>

            {/* Price */}
            <div className="h-7 w-32 bg-slate-700 rounded mb-2"></div>

            {/* Description */}
            <div className="h-4 w-full bg-slate-700 rounded mb-2"></div>
            <div className="h-4 w-3/4 bg-slate-700 rounded mb-4"></div>

            {/* Actions */}
            <div className="flex items-center justify-between gap-2">
                <div className="h-6 w-11 bg-slate-700 rounded-full"></div>
                <div className="flex gap-2">
                    <div className="h-9 w-9 bg-slate-700 rounded-lg"></div>
                    <div className="h-9 w-20 bg-slate-700 rounded-lg"></div>
                </div>
            </div>
        </article>
    );
}

export default KitnetSkeleton;
