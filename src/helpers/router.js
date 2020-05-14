import VueRouter from "vue-router";
import Home from "../routes/Home.vue";
import Game from "../routes/Game.vue";
import Auth from "../routes/Auth.vue";
import SongSelect from "../routes/SongSelect.vue";
import SheetEditor from "../routes/SheetEditor.vue";
const router = new VueRouter({
  mode: "history",
  routes: [
    { path: "/", component: Home },
    { path: "/menu", component: SongSelect },
    {
      path: "/game",
      component: Game,
      children: [{ path: ":sheet", component: Game }],
    },
    { path: "/account", component: Auth },
    { path: "/editor", component: SheetEditor },
    { path: "*", component: Home },
  ],
});
export default router;
