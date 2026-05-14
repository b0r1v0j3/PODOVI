type PodoviWordmarkProps = {
  className?: string;
  textClassName?: string;
  lineClassName?: string;
};

export default function PodoviWordmark({
  className = '',
  textClassName = 'text-2xl text-[#1D1D1F]',
  lineClassName = 'h-[3px]',
}: PodoviWordmarkProps) {
  return (
    <span className={`relative inline-block pb-1.5 ${className}`.trim()}>
      <span className={`font-semibold lowercase tracking-tighter ${textClassName}`.trim()}>
        podovi
      </span>
      <span
        aria-hidden="true"
        className={`absolute bottom-0 left-0 w-full rounded-full bg-primary-600 ${lineClassName}`.trim()}
      />
    </span>
  );
}
