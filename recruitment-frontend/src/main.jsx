import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { CssBaseline, ThemeProvider, createTheme } from "@mui/material";
import App from "./App";
import "./styles.css";

const theme = createTheme({
  palette: { mode:"light", primary:{main:"#4f46e5"}, secondary:{main:"#0f766e"},
    background:{default:"#f6f7fb",paper:"#ffffff"} },
  typography:{fontFamily:'Inter, ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif',
    h5:{fontWeight:750}, button:{textTransform:"none",fontWeight:650}},
  shape:{borderRadius:12},
  components:{MuiButton:{defaultProps:{disableElevation:true}},MuiCard:{styleOverrides:{root:{border:"1px solid #e8eaf2",boxShadow:"0 4px 18px rgba(18,25,45,.035)"}}}}
});
createRoot(document.getElementById("root")).render(
  <React.StrictMode><BrowserRouter><ThemeProvider theme={theme}><CssBaseline/><App/></ThemeProvider></BrowserRouter></React.StrictMode>
);