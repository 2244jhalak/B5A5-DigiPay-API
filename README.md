# B5A5 DigiPay API

## 📌 Project Overview

**B5A5 DigiPay API** is a secure, modular, and role-based backend API for a digital wallet system, similar to popular services like Bkash or Nagad.  
It is built using **Node.js**, **Express.js**, and **TypeScript**, providing robust authentication, wallet management, and financial transaction capabilities such as adding money, withdrawing, and sending money.

This API is designed for developers to integrate digital payment features into applications while maintaining security and scalability.

---

## 🚀 Features

### Role-Based Access Control

- **Admin:**  
  - Can create new users  
  - Can block/unblock users or wallets  
  - Can view **any user’s wallet**  
  - Can view **transactions of any user**  

- **Agent:**  
  - Can perform **cash-in** (add money) and **cash-out** (withdraw money) operations for users  

- **Normal User:**  
  - Can view their own wallet balance and transaction history  
  - Can perform **top-up** (add money), **withdraw**, and **send money** to other users  

### General Features

- ✅ JWT-based authentication and role-based authorization  
- ✅ Automatic wallet creation on user registration  
- ✅ Secure password storage with bcrypt  
- ✅ Modular architecture for scalability  
- ✅ Input validation and centralized error handling

### Folder Structure
B5A5-DigiPay-API/
│
├── src/                  # Source code
│   ├── app.ts            # Express app configuration and server entry point
│   ├── modules/          # Feature-specific modules (auth,users, wallet, transaction.)
|
├── dist/                 # Compiled JavaScript code
├── .gitignore            # Files to ignore in Git
├── package.json          # Project dependencies & scripts
├── package-lock.json     # Lock file
└── tsconfig.json         # TypeScript configuration


---

## 🛠️ Technologies Used

- **Backend:** Node.js, Express.js  
- **Language:** TypeScript  
- **Database:** MongoDB (with Mongoose)  
- **Authentication:** JWT (JSON Web Tokens)  
- **Password Security:** bcrypt  
- **Linting & Code Quality:** ESLint  
- **Version Control:** Git & GitHub  

---

## ⚙️ Installation & Setup

1. **Clone the repository:**

```bash
git clone https://github.com/2244jhalak/B5A5-DigiPay-API.git
cd B5A5-DigiPay-API
