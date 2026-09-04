"use client";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import styles from "./cliente-menu.module.css";

export default function ClienteMenu(){
 const router=useRouter();const pathname=usePathname();const [open,setOpen]=useState(false);const [authenticated,setAuthenticated]=useState(false);const [name,setName]=useState("");
 useEffect(()=>{const supabase=createClient();let mounted=true;(async()=>{const {data:{user}}=await supabase.auth.getUser();if(!mounted)return;setAuthenticated(Boolean(user));if(user){const {data:profile}=await supabase.from("customer_profiles").select("name").eq("id",user.id).maybeSingle();if(mounted)setName(profile?.name||user.user_metadata?.name||"")}})();const {data:listener}=supabase.auth.onAuthStateChange((_event,session)=>{if(!mounted)return;setAuthenticated(Boolean(session?.user));if(!session)setName("")});return()=>{mounted=false;listener.subscription.unsubscribe()}},[pathname]);
 const openLogin=()=>router.push(`/cliente/login${typeof window!=="undefined"?window.location.search:""}`);
 if(!authenticated)return <button className={styles.loginButton} type="button" onClick={openLogin}>Entrar</button>;
 async function logout(){const {error}=await createClient().auth.signOut({scope:"local"});if(!error){setOpen(false);router.push("/agendamento")}}
 return <div className={styles.root}>
  <button className={styles.menuButton} type="button" aria-label="Abrir menu do cliente" aria-expanded={open} onClick={()=>setOpen(v=>!v)}><span className={styles.hamburger} aria-hidden="true"><i/><i/><i/></span><strong>Menu</strong></button>
  {open&&<><button className={styles.backdrop} aria-label="Fechar menu" onClick={()=>setOpen(false)}/><aside className={styles.panel} aria-label="Menu da área do cliente">
   <div className={styles.panelTitle}><span>ÁREA DO CLIENTE</span>{name&&<strong>{name}</strong>}</div>
   <nav className={styles.nav}>
    <button className={pathname==="/cliente/perfil"?styles.active:""} onClick={()=>{setOpen(false);router.push("/cliente/perfil")}}><span>Meu perfil</span></button>
    <button className={pathname==="/cliente/agendamentos"?styles.active:""} onClick={()=>{setOpen(false);router.push("/cliente/agendamentos")}}><span>Agendamentos</span></button>
    <button className={pathname==="/cliente/historico"?styles.active:""} onClick={()=>{setOpen(false);router.push("/cliente/historico")}}><span>Histórico</span></button>
   </nav>
   <button className={styles.logout} onClick={logout}><span>Sair</span></button>
  </aside></>}
 </div>
}
