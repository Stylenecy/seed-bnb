import { Config } from "@remotion/cli/config";

Config.setVideoImageFormat("jpeg");
Config.setOverwriteOutput(true);
// Public assets (screenshots, mascots, audio) live in ./public.
Config.setPublicDir("public");
