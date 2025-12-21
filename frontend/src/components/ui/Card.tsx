import { HTMLAttributes, forwardRef } from 'react'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  selected?: boolean
  hoverable?: boolean
}

const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className = '', selected, hoverable, children, ...props }, ref) => {
    const baseStyles = 'bg-white rounded-xl shadow-md p-4 transition-all duration-200'
    const hoverStyles = hoverable ? 'hover:shadow-lg hover:scale-[1.02] cursor-pointer' : ''
    const selectedStyles = selected ? 'ring-2 ring-christmas-red shadow-lg' : ''

    return (
      <div
        ref={ref}
        className={`${baseStyles} ${hoverStyles} ${selectedStyles} ${className}`}
        {...props}
      >
        {children}
      </div>
    )
  }
)

Card.displayName = 'Card'
export default Card
