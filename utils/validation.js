
/**
 * Unified Password Validator
 * Requirements:
 * - Minimum 8 characters
 * - At least one uppercase letter
 * - At least one lowercase letter
 * - At least one number
 * - At least one special character (@$!%*?&)
 */
export const validatePassword = (password) => {
    // Requirements: 8+ chars, at least one [a-z], [A-Z], [0-9], and one special char
    // Allowed special chars: @ $ ! % * ? & . # _ -
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&.#_-])[A-Za-z\d@$!%*?&.#_-]{8,}$/;

    if (!password) {
        return {
            isValid: false,
            message: 'Password is required'
        };
    }

    if (!passwordRegex.test(password)) {
        return {
            isValid: false,
            message: 'Password must be at least 8 characters long and include uppercase, lowercase, number, and a special character (e.g. @, #, $, ., !, _, -).'
        };
    }

    return {
        isValid: true,
        message: 'Password is valid'
    };
};
