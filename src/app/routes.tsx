import { createBrowserRouter } from "react-router";
import Home from "./pages/Home";
import Goals from "./pages/Goals";
import Groups from "./pages/Groups";
import GroupDetail from "./pages/GroupDetail";
import Social from "./pages/Social";
import Profile from "./pages/Profile";
import UserProfile from "./pages/UserProfile";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Settings from "./pages/Settings";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: Home,
  },
  {
    path: "/login",
    Component: Login,
  },
  {
    path: "/register",
    Component: Register,
  },
  {
    path: "/goals",
    Component: Goals,
  },
  {
    path: "/groups",
    Component: Groups,
  },
  {
    path: "/groups/:groupId",
    Component: GroupDetail,
  },
  {
    path: "/social",
    Component: Social,
  },
  {
    path: "/profile",
    Component: Profile,
  },
  {
    path: "/settings",
    Component: Settings,
  },
  {
    path: "/user/:userId",
    Component: UserProfile,
  },
]);