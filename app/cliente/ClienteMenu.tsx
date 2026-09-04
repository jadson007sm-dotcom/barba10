"use client";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import styles from "./cliente-menu.module.css";

export default function ClienteMenu(){
 const router=useRouter();const pathname=usePathname();const [open,setOpen]=useState(false);const [authenticated,setAuthenticated]=useState(false);const [authChecked,setAuthChecked]=useState(false);const [name,setName]=useState("");
 useEffect(()=>{const supabase=createClient();let mounted=true;(async()=>{const {data:{user}}=await supabase.auth.getUser();if(!mounted)return;setAuthenticated(Boolean(user));setAuthChecked(true);if(user){const {data:profile}=await supabase.from("customer_profiles").select("name").eq("id",user.id).maybeSingle();if(mounted)setName(profile?.name||user.user_metadata?.name||"")}})();const {data:listener}=supabase.auth.onAuthStateChange((_event,session)=>{if(!mounted)return;setAuthenticated(Boolean(session?.user));setAuthChecked(true);if(!session){setName("");setOpen(false)}});return()=>{mounted=false;listener.subscription.unsubscribe()}},[pathname]);
 const openLogin=()=>router.push(`/cliente/login${typeof window!=="undefined"?window.location.search:""}`);
 if(!authChecked)return null;
 if(!authenticated)return <button className={styles.loginButton} type="button" onClick={openLogin}>Entrar</button>;
 async function logout(){const {error}=await createClient().auth.signOut({scope:"local"});if(!error){setOpen(false);setAuthenticated(false);router.push("/agendamento")}}
 return <div className={styles.root}>
  <button className={styles.menuButton} type="button" aria-label={open?"Fechar menu":"Abrir menu"} aria-expanded={open} onClick={()=>setOpen(v=>!v)}><span className={styles.hamburger} aria-hidden="true"><i/><i/><i/></span></button>
  {open&&<><button className={styles.backdrop} aria-label="Fechar menu" onClick={()=>setOpen(false)}/><aside className={styles.panel} aria-label="Menu do cliente">
   <div className={styles.panelTitle}><span>ÁREA DO CLIENTE</span>{name&&<strong>{name}</strong>}</div>
   <nav className={styles.nav}>
    <button type="button" className={pathname==="/cliente/perfil"?styles.active:""} onClick={()=>{setOpen(false);router.push("/cliente/perfil")}}>Meu perfil</button>
    <button type="button" className={pathname==="/cliente/agendamentos"?styles.active:""} onClick={()=>{setOpen(false);router.push("/cliente/agendamentos")}}>Agendamentos</button>
    <button type="button" className={pathname==="/cliente/historico"?styles.active:""} onClick={()=>{setOpen(false);router.push("/cliente/historico")}}>Histórico</button>
   </nav>
   <button type="button" className={styles.logout} onClick={logout}>Sair</button>
  </aside></>}
 </div>
}
