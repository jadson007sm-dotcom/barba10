export type Role='super_admin'|'tenant_owner'|'shop_manager'|'barber'|'attendant'|'customer'
export type AppointmentStatus='pending'|'confirmed'|'completed'|'cancelled'|'no_show'
export interface Profile{id:string;full_name:string;whatsapp:string|null;role:Role;tenant_id:string|null;shop_id:string|null;is_active:boolean}
export interface Tenant{id:string;name:string;slug:string;owner_id:string|null;phone:string|null;email:string|null;is_active:boolean}
export interface Shop{id:string;tenant_id:string;name:string;slug:string;phone:string|null;address:string|null;city:string|null;state:string|null;is_active:boolean}
export interface Service{id:string;tenant_id:string;shop_id:string|null;name:string;description:string|null;duration_minutes:number;price:number;is_active:boolean}
export interface Appointment{id:string;tenant_id:string;shop_id:string;customer_id:string;barber_id:string|null;service_id:string;starts_at:string;ends_at:string;status:AppointmentStatus;price:number;notes:string|null}
