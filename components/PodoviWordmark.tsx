type PodoviWordmarkProps = {
  className?: string;
  textClassName?: string;
};

export default function PodoviWordmark({
  className = '',
  textClassName = 'text-2xl text-ink-900',
}: PodoviWordmarkProps) {
  return (
    <span className={`inline-block ${className}`.trim()}>
      <span className={`font-bold lowercase tracking-[-0.02em] ${textClassName}`.trim()}>
        podovi
      </span>
    </span>
  );
}
