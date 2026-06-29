export function checkAuth(isProtectedPage) {
    const user = localStorage.getItem('user');

    if (isProtectedPage && !user) {
        window.location.replace('login.html');
    } else if (!isProtectedPage && user) {
        window.location.replace('index.html');
    }
}


export function loginUser(userName, password) {

    let users = JSON.parse(localStorage.getItem("registeredUsers")) || [];
   
    const user = users.find((u)=>{

       return  u.userName === userName && u.password === password;

    })

    
    if (user) {

        const sessionUser = { userName: user.userName, currency: user.curr };

        localStorage.setItem('user', JSON.stringify(sessionUser));

        return { success: true, message: "Login successful!" };
    }

    return {
        success: false,
        message: "Invalid username or password"
    };
}





export function registerUser(userName,password,curr){
    let users = JSON.parse(localStorage.getItem('registeredUsers')) || [];

    const userExists = users.some(u => u.userName === userName);
    if (userExists) {
        return { success: false, message: "Username already exists! Please choose another." };
    }

    const newUser = { userName, password, curr };
    users.push(newUser);

    localStorage.setItem('registeredUsers', JSON.stringify(users));

    return { success: true, message: "Registration successful! You can now log in." };
}
