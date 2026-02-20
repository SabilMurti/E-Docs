/**
 * Skeleton Loader Component
 * 
 * @param {Object} props
 * @param {'circle' | 'rect' | 'rounded' | 'full'} props.shape - Shape of skeleton
 * @param {'sm' | 'md' | 'lg' | 'xl'} props.width - Width variant
 * @param {'sm' | 'md' | 'lg'} props.height - Height variant
 * @param {boolean} props.animate - Enable pulse animation
 * @param {string} props.className - Additional CSS classes
 */
export default function Skeleton({
    shape = 'rounded',
    width = 'md',
    height = 'md',
    animate = true,
    className = '',
}) {
    const shapeClasses = {
        circle: 'rounded-full',
        rect: 'rounded-none',
        rounded: 'rounded-lg',
        full: 'rounded-xl',
    };

    const widthClasses = {
        sm: 'w-8',
        md: 'w-16',
        lg: 'w-24',
        xl: 'w-full',
    };

    const heightClasses = {
        sm: 'h-4',
        md: 'h-6',
        lg: 'h-8',
    };

    return (
        <div
            className={`
                bg-[var(--color-bg-tertiary)] 
                ${shapeClasses[shape]} 
                ${widthClasses[width]} 
                ${heightClasses[height]}
                ${animate ? 'animate-pulse' : ''}
                ${className}
            `}
            aria-hidden="true"
        />
    );
}

/**
 * Card Skeleton - For site cards, page cards
 */
export function CardSkeleton({ count = 1 }) {
    return (
        <>
            {Array.from({ length: count }).map((_, i) => (
                <div
                    key={i}
                    className="rounded-xl border border-[var(--color-border-primary)] bg-[var(--color-bg-secondary)] p-4"
                >
                    <div className="flex items-start gap-3">
                        <Skeleton shape="circle" width="md" height="md" />
                        <div className="flex-1 space-y-2">
                            <Skeleton width="xl" height="sm" />
                            <Skeleton width="lg" height="sm" />
                        </div>
                    </div>
                </div>
            ))}
        </>
    );
}

/**
 * Text Skeleton - For lines of text
 */
export function TextSkeleton({ lines = 3 }) {
    return (
        <div className="space-y-2">
            {Array.from({ length: lines }).map((_, i) => (
                <Skeleton
                    key={i}
                    width="xl"
                    height="sm"
                    className={i === lines - 1 ? 'w-3/4' : ''}
                />
            ))}
        </div>
    );
}

/**
 * Page Skeleton - For full page loading
 */
export function PageSkeleton() {
    return (
        <div className="p-6 space-y-6">
            <div className="flex items-center gap-4">
                <Skeleton shape="circle" width="lg" height="lg" />
                <div className="flex-1">
                    <Skeleton width="xl" height="lg" className="mb-2" />
                    <Skeleton width="lg" height="sm" />
                </div>
            </div>
            <TextSkeleton lines={6} />
        </div>
    );
}
