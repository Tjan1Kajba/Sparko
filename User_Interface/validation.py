

def validate_password(password: str) -> str:
    if len(password) < 4:
        return "Password must be at least 4 characters long."
    if not any(char.isdigit() for char in password):
        return "Password must contain at least one number."
    return None


def validate_user_exists(username: str, email: str, users_collection) -> str:
    if users_collection.find_one({"username": username}):
        return "Username already exists."
    if users_collection.find_one({"email": email}):
        return "Email already exists."
    return None


def validate_passwords_match(password: str, confirm_password: str) -> str:
    if password != confirm_password:
        return "Passwords do not match."
    return None


def validate_credentials(email: str, password: str, users_collection, pwd_context):
    user = users_collection.find_one({"email": email})
    if not user or not pwd_context.verify(password, user["password"]):
        return False, "Invalid credentials.", None
    return True, None, user


def validate_registration_data(username: str, email: str, password: str, confirm_password: str, users_collection) -> str:
    password_error = validate_password(password)
    if password_error:
        return password_error
    match_error = validate_passwords_match(password, confirm_password)
    if match_error:
        return match_error
    user_exists_error = validate_user_exists(username, email, users_collection)
    if user_exists_error:
        return user_exists_error
    return None
