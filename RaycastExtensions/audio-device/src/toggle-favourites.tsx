import { getPreferenceValues, showHUD, showToast, Toast } from "@raycast/api";
import {
  AudioDevice,
  getDefaultOutputDevice,
  getOutputDevices,
  setDefaultOutputDevice,
  setDefaultSystemDevice,
} from "./audio-device";
import { getFavouriteDevice } from "./helpers";

export default async () => {
  const favourite = await getFavouriteDevice("output");
  const { systemOutput } = getPreferenceValues();

  if (favourite) {
    try {
      const devices = await getOutputDevices();
      let device = devices.find((d) => d.uid === favourite.uid);

      if (!device) {
        device = devices.find((d) => d.name === favourite.name);
      }

      if (device) {
        await setDefaultOutputDevice(device.id);
        if (systemOutput) {
          await setDefaultSystemDevice(device.id);
        }
        await showHUD(`Active output audio device set to ${favourite.name}`);
      } else {
        await showToast({
          style: Toast.Style.Failure,
          title: "Favourite output audio device not found",
        });
      }
    } catch (err: any) {
      await showToast({
        style: Toast.Style.Failure,
        title: "Favourite output audio device could not be set",
        message: err.message,
      });
      console.error("Error setting favourite output device:", err);
    }
  } else {
    await showToast({
      style: Toast.Style.Failure,
      title: "No favourite output audio device specified",
    });
  }
};
