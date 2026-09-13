type BrandLogoProps = {
  className?: string
  alt?: string
}

export function BrandLogo({ className = "h-8 w-8", alt = "Inmaculada Music" }: BrandLogoProps) {
  return (
    <img
      src="/logo.png"
      alt={alt}
      width={128}
      height={128}
      className={`rounded-full object-cover ${className}`}
    />
  )
}
