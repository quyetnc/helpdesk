import PropTypes from 'prop-types';

export function Button({
  children,
  onClick,
  type = 'button',
  disabled = false,
  variant = 'default',
  isLoading = false,
  className = '',
  ...props
}) {
  const baseClasses = 'px-4 py-2 rounded-lg font-medium transition duration-200 inline-flex items-center justify-center';

  const variantClasses = {
    primary: 'bg-blue-600 hover:bg-blue-700 text-white disabled:bg-gray-400',
    danger: 'bg-red-600 hover:bg-red-700 text-white disabled:bg-gray-400',
    ghost: 'bg-transparent hover:bg-gray-100 text-gray-700 disabled:text-gray-400',
    default: 'bg-gray-200 hover:bg-gray-300 text-gray-900 disabled:bg-gray-300',
  };

  const classes = [
    baseClasses,
    variantClasses[variant] || variantClasses.default,
    (disabled || isLoading) && 'opacity-60 cursor-not-allowed',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || isLoading}
      className={classes}
      {...props}
    >
      {isLoading && (
        <div className="animate-spin rounded-full h-4 w-4 border-2 border-current border-t-transparent mr-2" />
      )}
      {children}
    </button>
  );
}

Button.propTypes = {
  children: PropTypes.node.isRequired,
  onClick: PropTypes.func,
  type: PropTypes.string,
  disabled: PropTypes.bool,
  variant: PropTypes.string,
  isLoading: PropTypes.bool,
  className: PropTypes.string,
};
