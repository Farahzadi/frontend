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
import { useSelector } from "react-redux";
import { notificationsSelector } from "lib/store/features/api/apiSlice";
import Core from "lib/api/Core";
import { Badge } from "@mui/material";

export const NotificationDrawer = () => {
  const [right, setRight] = useState(false);
  const notifData = useSelector(notificationsSelector);

  const toggleDrawer = open => event => {
    if (event && event.type === "keydown" && (event.key === "Tab" || event.key === "Shift")) {
      return;
    }
    setRight(open);
  };

  const NotifictionCard = {
    fontSize: "15px",
    fontWeight: 300,
    minHeight: "70px",
    borderRadius: "14px",
    color: "#000",
    border: 0,
  };

  const notifTypeTranslator = type => {
    if (!["error", "info", "success", "warning"].includes(type)) type = "info";
    return type;
  };

  const list = anchor => (
    <Box sx={{ width: 350 }} role="presentation">
      <List sx={{ borderColor: "red" }}>
        <h5>Notifications</h5>
        <i role="button" onClick={toggleDrawer(false)} class="icon-remove icon-2x"></i>
        <Divider />
        {notifData.map(
          notif =>
            notif.show && (
              <ListItem key={notif.id} disablePadding>
                <ListItemButton
                  sx={{
                    "&:hover": {
                      bgcolor: "#0c2347",
                    },
                  }}>
                  <ListItemText>
                    <Alert
                      severity={notifTypeTranslator(notif.type)}
                      sx={NotifictionCard}
                      onClose={() => {
                        Core.run("notify", "remove", notif.id);
                      }}>
                      {notif.message}
                    </Alert>
                  </ListItemText>
                </ListItemButton>
              </ListItem>
            ),
        )}
      </List>
    </Box>
  );

  return (
    <div>
      <>
        <NotifictionSidebar onClick={toggleDrawer(true)}>
          <Badge badgeContent={notifData.length} color="primary">
            <i class="icon-bell-alt"></i>
          </Badge>
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
