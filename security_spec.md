# La Casa Firestore Security Specification

## 1. Data Invariants

1. **Identity & Role Integrity**: Users cannot assign themselves `'admin'` during registration (`users/{userId}` creation requires `role == 'customer'`). Only `/admins/{uid}` or verified admin email (`pra77tik@gmail.com` with `email_verified == true`) grants admin privileges.
2. **PII Isolation**: User profile documents (`users/{userId}`) contain phone, email, and addresses; `get` is restricted to owner or admin, and `list` is restricted to admins only.
3. **Catalog Price Integrity**: Only admins may create, update, or delete `products`, `categories`, and `offers`. Customers have read-only access.
4. **Order Integrity**: Only authenticated users may create orders for their own `userId`. New orders must start with `orderStatus == 'Order Placed'`, `paymentStatus == 'pending'`, positive subtotal/total, and server timestamps (`request.time`). Customers can only cancel an order while it is still `'Order Placed'`; admins control status progression and payment status.
5. **Query Enforcer**: `orders` list queries require `resource.data.userId == request.auth.uid` (unless verified admin).

## 2. The "Dirty Dozen" Attack Payloads (All Must Fail with PERMISSION_DENIED)

1. **Self-Admin Registration**: `create /users/attacker` with `{ uid: "attacker", role: "admin", ... }`
2. **Role Escalation Update**: `update /users/attacker` with `{ role: "admin" }`
3. **PII Snooping (Get)**: User A calls `get /users/userB`
4. **PII Scraping (List)**: Customer calls `list /users`
5. **Customer Price Tampering**: Customer calls `update /products/paneer-butter-masala` with `{ price: 1 }`
6. **Spoofed Order Owner**: User A calls `create /orders/ord-1` with `{ userId: "userB", ... }`
7. **Fake Paid Order Creation**: User A calls `create /orders/ord-2` with `{ userId: "userA", paymentStatus: "paid", orderStatus: "Completed" }`
8. **Order Total Manipulation**: User A calls `create /orders/ord-3` with `{ subtotal: 500, discount: 0, tax: 25, totalAmount: 10 }`
9. **Unauthorized Order Read**: User A calls `get /orders/userB-order`
10. **Unscoped Orders List**: Customer calls `list /orders` without `where('userId', '==', auth.uid)`
11. **Shadow Ghost Field Injection**: User A calls `update /users/userA` with `{ fullName: "Valid", isVip: true }`
12. **Terminal State Mutation**: User A calls `update /orders/ord-completed` (where `orderStatus == 'Completed'`) with `{ orderStatus: 'Cancelled' }`
