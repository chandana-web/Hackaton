import React, {useEffect, useState} from "react";
import {Routes,Route,Navigate,useLocation,useNavigate} from "react-router-dom";
import {AppBar,Box,Drawer,Toolbar,Typography,IconButton,List,ListItemButton,ListItemIcon,ListItemText,Divider,Avatar,Chip,FormControl,Select,MenuItem,Button,Dialog,DialogTitle,DialogContent,DialogActions,TextField,Alert,CircularProgress,Stack} from "@mui/material";
import {Menu as MenuIcon,DashboardRounded,WorkOutline,PeopleAltOutlined,AssignmentOutlined,EventOutlined,RateReviewOutlined,LocalOfferOutlined,ManageAccounts,Groups2Outlined} from "@mui/icons-material";
import {getDataMode,setDataMode,hasApiToken,setApiToken} from "./dataMode";
import api from "./api";
import Dashboard from "./pages/Dashboard";
import Requisitions from "./pages/Requisitions";
import Candidates from "./pages/Candidates";
import Applications from "./pages/Applications";
import Interviews from "./pages/Interviews";
import Feedback from "./pages/Feedback";
import Offers from "./pages/Offers";
import Users from "./pages/Users";
import Interviewers from "./pages/Interviewers";
const drawerWidth=250;
const nav=[["Dashboard","/",DashboardRounded],["Requisitions","/requisitions",WorkOutline],["Candidates","/candidates",PeopleAltOutlined],["Applications","/applications",AssignmentOutlined],["Interviews","/interviews",EventOutlined],["Feedback","/feedback",RateReviewOutlined],["Offers","/offers",LocalOfferOutlined]];
const pageRoles={"/candidates":["OPERATIONS_ANALYST","SYSTEM_ADMIN"],"/applications":["OPERATIONS_ANALYST","SYSTEM_ADMIN"],"/interviews":["OPERATIONS_ANALYST","INTERVIEWER","SYSTEM_ADMIN"],"/feedback":["OPERATIONS_ANALYST","INTERVIEWER","SYSTEM_ADMIN"],"/offers":["OPERATIONS_ANALYST","APPROVER","SYSTEM_ADMIN"]};
function Shell(){
 const [open,setOpen]=useState(true); const [mode,setMode]=useState(getDataMode()); const [loginOpen,setLoginOpen]=useState(false); const [authMode,setAuthMode]=useState("login"); const [credentials,setCredentials]=useState({email:"",password:"",name:"",setupKey:""}); const [authError,setAuthError]=useState(""); const [authLoading,setAuthLoading]=useState(false); const [user,setUser]=useState(null); const [authRefresh,setAuthRefresh]=useState(0); const [reloadKey,setReloadKey]=useState(0); const loc=useLocation(); const navTo=useNavigate();
 const changeMode=value=>{setDataMode(value);setMode(value);setReloadKey(key=>key+1);if(value==="api"&&!hasApiToken()){setAuthMode("login");setLoginOpen(true)}};
 const adminNav=[["Interviewers","/interviewers",Groups2Outlined],["Users","/users",ManageAccounts]];
 const title=([...nav,...adminNav].find(n=>n[1]===loc.pathname)?.[0])||"Recruitment";
 const canOpenPage=path=>!user||!pageRoles[path]||pageRoles[path].includes(user.role);
 const navItems=(user?nav.filter(([,path])=>canOpenPage(path)):nav);
 if(user?.role==="SYSTEM_ADMIN")navItems.push(...adminNav);

 useEffect(()=>{
  if(mode!=="api"){setUser(null);setAuthLoading(false);return undefined}
  if(!hasApiToken()){setUser(null);setAuthLoading(false);setLoginOpen(true);return undefined}
  setAuthLoading(true);
  let active=true;
  api.get("/auth/me").then(response=>{if(active)setUser(response.data.data)}).catch(()=>{if(active){setApiToken("");setUser(null);setAuthMode("login");setLoginOpen(true)}}).finally(()=>{if(active)setAuthLoading(false)});
  return ()=>{active=false};
 },[mode,authRefresh]);

 const finishAuthentication=result=>{setApiToken(result.token);setUser(result.user);setAuthError("");setLoginOpen(false);setCredentials({email:"",password:"",name:"",setupKey:""});setAuthRefresh(value=>value+1);setReloadKey(key=>key+1)};
 const submitLogin=async()=>{setAuthLoading(true);setAuthError("");try{const response=await api.post("/auth/login",{email:credentials.email,password:credentials.password});finishAuthentication(response.data.data)}catch(error){setAuthError(error.message)}finally{setAuthLoading(false)}};
 const submitBootstrap=async()=>{setAuthLoading(true);setAuthError("");try{const response=await api.post("/auth/bootstrap",credentials);finishAuthentication(response.data.data)}catch(error){setAuthError(error.message)}finally{setAuthLoading(false)}};
 const logout=()=>{setApiToken("");setUser(null);setAuthMode("login");setAuthError("");setCredentials({email:"",password:"",name:"",setupKey:""});setLoginOpen(true);setAuthRefresh(value=>value+1);setReloadKey(key=>key+1)};
 const closeLogin=()=>{setLoginOpen(false);if(!user)changeMode("demo")};
 return <Box sx={{display:"flex",minHeight:"100vh"}}>
  <AppBar position="fixed" sx={{zIndex:1201,background:"#fff",color:"#172033",borderBottom:"1px solid #e8eaf2",boxShadow:"none"}}>
   <Toolbar><IconButton onClick={()=>setOpen(!open)} edge="start" sx={{mr:2}}><MenuIcon/></IconButton>
    <Typography fontWeight={800} sx={{letterSpacing:-.5}}>Hire<span style={{color:"#4f46e5"}}>Flow</span></Typography>
   <Box sx={{flex:1}}/>
   <FormControl size="small" sx={{minWidth:160,mr:1}}>
    <Select value={mode} onChange={e=>changeMode(e.target.value)} inputProps={{"aria-label":"Data source"}}>
     <MenuItem value="demo">Demo data</MenuItem><MenuItem value="api">Authenticated API</MenuItem>
    </Select>
   </FormControl>
   {mode==="api"&&user&&<><Chip label={`${user.name} · ${user.role.replaceAll("_"," ")}`} size="small" variant="outlined"/><Button size="small" onClick={logout}>Sign out</Button></>}
   {mode==="api"&&!user&&<Button size="small" onClick={()=>setLoginOpen(true)}>Sign in</Button>}
   <Chip label={mode==="demo"?"Read-only demo":"API workspace"} size="small" color={mode==="demo"?"warning":"primary"} variant="outlined" sx={{ml:1}}/>
   <Avatar sx={{ml:2,bgcolor:"#e0e7ff",color:"#4338ca",width:34,height:34}}>HF</Avatar>
   </Toolbar>
  </AppBar>
  <Drawer variant="persistent" open={open} sx={{width:open?drawerWidth:0,flexShrink:0,"& .MuiDrawer-paper":{width:drawerWidth,boxSizing:"border-box",borderRight:"1px solid #e8eaf2",background:"#fbfcff"}}}>
   <Toolbar/><Box sx={{px:2,pt:2,pb:1}}><Typography variant="overline" color="text.secondary" fontWeight={700}>WORKSPACE</Typography></Box>
   <List sx={{px:1.5}}>{navItems.map(([label,path,Icon])=><ListItemButton key={path} selected={loc.pathname===path} onClick={()=>navTo(path)} sx={{borderRadius:2,mb:.5,"&.Mui-selected":{bgcolor:"#eef2ff",color:"#4338ca"},"&.Mui-selected:hover":{bgcolor:"#e5e9ff"}}}>
    <ListItemIcon sx={{minWidth:38,color:"inherit"}}><Icon fontSize="small"/></ListItemIcon><ListItemText primary={label} primaryTypographyProps={{fontWeight:650,fontSize:14}}/></ListItemButton>)}</List>
   <Box sx={{mt:"auto",p:2}}><Divider/><Typography variant="caption" color="text.secondary" sx={{display:"block",pt:2}}>Recruitment Management System</Typography><Typography variant="caption" color="text.secondary">Frontend · React + MUI</Typography></Box>
  </Drawer>
  <Box component="main" sx={{flexGrow:1,minWidth:0}}><Toolbar/><Box sx={{p:{xs:2,md:3.5},maxWidth:1500,mx:"auto"}}>
   <Box sx={{mb:3}}><Typography variant="caption" color="text.secondary">WORKSPACE / {title.toUpperCase()}</Typography><Typography variant="h5" sx={{mt:.5}}>{title}</Typography></Box>
   {mode==="demo"?<Alert severity="info" sx={{mb:2}}>Showing synthetic demo data. This mode is read-only; switch to Authenticated API to make changes.</Alert>:!user?<Alert severity="warning" sx={{mb:2}}>Sign in to load live records and use recruitment workflows.</Alert>:null}
   {authLoading&&mode==="api"&&!user?<Box sx={{display:"grid",placeItems:"center",py:5}}><CircularProgress/></Box>:<Routes key={`${mode}-${reloadKey}-${authRefresh}`}><Route path="/" element={<Dashboard user={user}/>}/><Route path="/requisitions" element={<Requisitions user={user}/>}/><Route path="/candidates" element={canOpenPage("/candidates")?<Candidates/>:<Navigate to="/" replace/>}/><Route path="/applications" element={canOpenPage("/applications")?<Applications/>:<Navigate to="/" replace/>}/>   <Route path="/interviews" element={canOpenPage("/interviews")?<Interviews user={user}/>:<Navigate to="/" replace/>}/><Route path="/feedback" element={canOpenPage("/feedback")?<Feedback user={user}/>:<Navigate to="/" replace/>}/><Route path="/offers" element={canOpenPage("/offers")?<Offers/>:<Navigate to="/" replace/>}/><Route path="/users" element={user?.role==="SYSTEM_ADMIN"?<Users/>:<Navigate to="/" replace/>}/><Route path="/interviewers" element={user?.role==="SYSTEM_ADMIN"?<Interviewers/>:<Navigate to="/" replace/>}/><Route path="*" element={<Navigate to="/" replace/>}/></Routes>}
  </Box></Box>
  <Dialog open={loginOpen} onClose={closeLogin} fullWidth maxWidth="sm">
   <DialogTitle>{authMode==="bootstrap"?"Set up the first administrator":"Sign in to HireFlow"}</DialogTitle>
   <DialogContent>
    <Stack spacing={2} sx={{pt:1}}>
     {authError&&<Alert severity="error">{authError}</Alert>}
     {authMode==="login"&&<Alert severity="info">Accounts and roles are provisioned by a System Admin. To create an Approver, sign in as the admin, open Users, add an account with the Approver role, then sign out to switch accounts.</Alert>}
     {authMode==="bootstrap"&&<><Alert severity="info">First-time setup is available only while no users exist. Configure BOOTSTRAP_ADMIN_SETUP_KEY on the backend, then use it here. This creates the first System Admin; subsequent accounts must be created by an administrator.</Alert><TextField label="Administrator name" value={credentials.name} onChange={e=>setCredentials({...credentials,name:e.target.value})} required/><TextField label="Setup key" type="password" value={credentials.setupKey} onChange={e=>setCredentials({...credentials,setupKey:e.target.value})} required/></>}
     <TextField label="Email" type="email" value={credentials.email} onChange={e=>setCredentials({...credentials,email:e.target.value})} required/>
     <TextField label="Password" type="password" value={credentials.password} onChange={e=>setCredentials({...credentials,password:e.target.value})} helperText={authMode==="bootstrap"?"Use at least 12 characters.":" "} required/>
    </Stack>
   </DialogContent>
   <DialogActions>
    {authMode==="login"?<Button onClick={()=>{setAuthMode("bootstrap");setAuthError("")}}>First-time setup</Button>:<Button onClick={()=>{setAuthMode("login");setAuthError("")}}>Back to sign in</Button>}
    <Button onClick={closeLogin}>Use demo mode</Button>
    <Button variant="contained" onClick={authMode==="bootstrap"?submitBootstrap:submitLogin} disabled={authLoading||!credentials.email||!credentials.password||(authMode==="bootstrap"&&(!credentials.name||!credentials.setupKey||credentials.password.length<12))}>{authMode==="bootstrap"?"Create admin":"Sign in"}</Button>
   </DialogActions>
  </Dialog>
 </Box>
}
export default function App(){return <Shell/>}