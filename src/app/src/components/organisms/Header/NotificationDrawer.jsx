import { useState } from "react";
import Box from "@mui/material/Box";
import SwipeableDrawer from "@mui/material/SwipeableDrawer";
import List from "@mui/material/List";
import Divider from "@mui/material/Divider";
import ListItem from "@mui/material/ListItem";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemText from "@mui/material/ListItemText";
import { NotifictionSidebar } from "./Header.module";
import Alert from "@mui/material/Alert";

export const NotificationDrawer = () => {
  const [right, setRight] = useState(false);
  const [notifData, setnotifData] = useState(["error", "warning", "info", "success"]);

  const toggleDrawer = (open) => (event) => {
    if (event && event.type === "keydown" && (event.key === "Tab" || event.key === "Shift")) {
      return;
    }
    setRight(open);
  };
  const deletNotif = (deleteNotifData) => {
    const temp = notifData.filter((t) => {
      // console.log(t===deleteNotifData);

      return t !== deleteNotifData;
    });
    console.log(temp);
    setnotifData(temp);
  };

  const NotifictionCard = {
    fontSize: "15px",
    fontWeight: 300,
    minHeight: "70px",
    borderRadius: "14px",
    color: "#000",
    // backgroundColor:"#fff",
    border: 0
  };

  const list = (anchor) => (
    <Box sx={{ width: 350 }} role="presentation">
      <List sx={{ borderColor: "red" }}>
        <h5>Notifications</h5>
        <i onClick={toggleDrawer(false)} class="icon-remove icon-2x"></i>
        <Divider />
        {notifData.map((notifType, i) => (
          <ListItem key={i} disablePadding>
            <ListItemButton
              sx={{
                "&:hover": {
                  bgcolor: "#0c2347"
                }
              }}>
              <ListItemText>
                {/* <NotifictionCard> */}
                <Alert
                  severity={notifType}
                  sx={NotifictionCard}
                  onClose={() => {
                    deletNotif(notifType);
                  }}>
                  This is a {notifType} alert — check it out!
                </Alert>
                {/* <p>some alerts goes there</p> */}
                {/* </NotifictionCard> */}
              </ListItemText>
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </Box>
  );

  return (
    <div>
      <>
        <NotifictionSidebar onClick={toggleDrawer(true)}>
          <i class="icon-bell-alt"></i>
        </NotifictionSidebar>
        <SwipeableDrawer
          sx={{ backdropFilter: "blur(2px)" }}
          className="drawerBox"
          anchor={"right"}
          open={right}
          onClose={toggleDrawer(false)}
          onOpen={toggleDrawer(true)}>
          {list("right")}
        </SwipeableDrawer>
      </>
    </div>
  );
};
