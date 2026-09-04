"use client";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import styles from "./cliente-menu.module.css";

export default function ClienteMenu(){
 const router=useRouter();
 const pathname=usePathname();
 const [open,setOpen]=useState(false);
 const [authenticated,setAuthenticated]=useState(false);
 const [authChecked,setAuthChecked]=useState(false);
 const [name,setName]=useState("");

 useEffect(()=>{
  const supabase=createClient();
  let mounted=true;
  async function syncCustomerSession(){
   const {data:{user}}=await supabase.auth.getUser();
   if(!mounted)return;
   if(!user){
    setAuthenticated(false);
    setName("");
    setOpen(false);
    setAuthChecked(true);
    return;
   }

   const accountType=typeof user.user_metadata?.account_type==="string"?user.user_metadata.account_type:"";
   const {data:profile}=await supabase.from("customer_profiles").select("name").eq("id",user.id).maybeSingle();
   if(!mounted)return;

   const isCustomer=accountType==="customer"||Boolean(profile);
   setAuthenticated(isCustomer);
   if(isCustomer)setName(profile?.name||user.user_metadata?.name||"");
   else{
    setName("");
    setOpen(false);
   }
   setAuthChecked(true);
  }

  syncCustomerSession();
  const {data:listener}=supabase.auth.onAuthStateChange(()=>{syncCustomerSession()});
  return()=>{mounted=false;listener.subscription.unsubscribe()};
 },[]);

 const openLogin=()=>router.push(`/cliente/login${typeof window!=="undefined"?window.location.search:""}`);
 if(!authChecked)return null;
 if(!authenticated)return <button className={styles.loginButton} type="button" onClick={openLogin}>Entrar</button>;

 async function logout(){
  const {error}=await createClient().auth.signOut({scope:"local"});
  if(!error){setOpen(false);setAuthenticated(false);setName("");router.push("/agendamento")}
 }

 return <div className={styles.root}>
  <button className={styles.menuButton} type="button" aria-label={open?"Fechar menu":"Abrir menu"} aria-expanded={open} onClick={()=>setOpen(v=>!v)}>
   <span/><span/><span/>
  </button>
  {open&&<>
   <button className={styles.backdrop} aria-label="Fechar menu" type="button" onClick={()=>setOpen(false)}/>
   <aside className={styles.panel} aria-label="Menu do cliente">
    <div className={styles.panelTitle}><span>Menu</span>{name&&<strong>{name}</strong>}</div>
    <nav className={styles.nav}>
     <button type="button" className={pathname==="/cliente/perfil"?styles.active:""} onClick={()=>{setOpen(false);router.push("/cliente/perfil")}}>Meu perfil</button>
     <button type="button" className={pathname==="/cliente/agendamentos"?styles.active:""} onClick={()=>{setOpen(false);router.push("/cliente/agendamentos")}}>Agendamentos</button>
     <button type="button" className={pathname==="/cliente/historico"?styles.active:""} onClick={()=>{setOpen(false);router.push("/cliente/historico")}}>Histórico</button>
    </nav>
    <button type="button" className={styles.logout} onClick={logout}>Sair</button>
   </aside>
  </>}
 </div>
}
