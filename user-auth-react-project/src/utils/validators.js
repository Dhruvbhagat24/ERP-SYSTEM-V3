export const validateLogin = (username, password) => {
    const errors = {};
    if (!username) {
        errors.username = "Username is required";
    }
    if (!password) {
        errors.password = "Password is required";
    }
    return {
        isValid: Object.keys(errors).length === 0,
        errors
    };
};

export const validateSignup = (username, email, password) => {
    const errors = {};
    if (!username) {
        errors.username = "Username is required";
    }
    if (!email) {
        errors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(email)) {
        errors.email = "Email is invalid";
    }
    if (!password) {
        errors.password = "Password is required";
    } else if (password.length < 6) {
        errors.password = "Password must be at least 6 characters long";
    }
    return {
        isValid: Object.keys(errors).length === 0,
        errors
    };
};