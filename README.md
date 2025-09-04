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

### 📂 Folder Structure

| Folder/File         | Description                                                      |
|--------------------|------------------------------------------------------------------|
| `src/`             | Source code                                                      |
| `src/app.ts`       | Express app configuration & server entry point                  |
| `src/modules/`     | Feature-specific modules (auth, users, wallet, transactions)    |
| `dist/`            | Compiled JavaScript output                                       |
| `.gitignore`       | Specifies files/folders to ignore in Git                        |
| `package.json`     | Project dependencies & scripts                                   |
| `package-lock.json`| Lock file for exact dependency versions                           |
| `tsconfig.json`    | TypeScript configuration                                         |

### Authentication Routes (/api/auth)
| Method | Endpoint  | Access | Description             |
| ------ | --------- | ------ | ----------------------- |
| POST   | /register | Public | Register a new user     |
| POST   | /login    | Public | Login and get JWT token |

### User Routes (/api/auth)
| Method | Endpoint           | Access | Description                 |
| ------ | ------------------ | ------ | --------------------------- |
| POST   | /create            | Admin  | Create a new user           |
| PATCH  | /block/\:id        | Admin  | Block or unblock a user     |
| PATCH  | /agentApprove/\:id | Admin  | Approve or suspend an Agent |

### Wallet Routes (/api/auth)
| Method | Endpoint          | Access             | Description                |
| ------ | ----------------- | ------------------ | -------------------------- |
| GET    | /me               | User, Agent, Admin | View own wallet            |
| POST   | /topup            | User               | Top-up (add money)         |
| POST   | /withdraw         | User               | Withdraw money             |
| POST   | /send             | User               | Send money to another user |
| GET    | /\:authId         | Admin              | View **any user’s wallet** |
| PATCH  | /block/\:walletId | Admin              | Block or unblock a wallet  |
| POST   | /cash-in  | Agent  | Add money to a user wallet        |
| POST   | /cash-out | Agent  | Withdraw money from a user wallet |


### Transactions Routes (/api/auth)
| Method | Endpoint | Access             | Description             |
| ------ | -------- | ------------------ | ----------------------- |
| GET    | /        | User, Agent, Admin | Get transaction history |


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
