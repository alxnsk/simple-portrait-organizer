# Simple Portrait Organizer
![Module logo](/artwork/module/cover.webp)

> [!NOTE]
> User needs a permission to upload files.


![Supported platforms](https://img.shields.io/badge/Supported_Foundry_Versions-10--13-%23556b2f)
![Version](https://img.shields.io/badge/dynamic/json?url=https%3A%2F%2Fgithub.com%2Falxnsk%2Fsimple-portrait-organizer%2Freleases%2Flatest%2Fdownload%2Fmodule.json&query=%24.version&style=flat&label=Current%20version&color=%23556b2f)
![License](https://img.shields.io/github/license/alxnsk/simple-portrait-organizer)

## TL;DR

It gives players a drag-and-drop portrait uploader that automatically converts images to WebP and stores them in a GM-specified location, all on the client side.

## Why?

No more "UltraHiRez 72Mb in size" **.png** files! 
No more, *or at least less*: pleas, tears, treats or social contracts during the pre-planning stage of your TRPG campaign!

This FoundryVTT module replaces the standard FilePicker window for non-GM users with a simple drag-and-drop interface, which **converts any provided image to WebP** format on the client side and **saves it in a location specified by the GM**.

All that, and it still looks less complicated than airplane controls, even for users who aren’t that tech-savvy.

Simple.

## Installation
Add-on **Modules** -> **Install Module** -> Paste this:

*https://github.com/alxnsk/simple-portrait-organizer/releases/latest/download/module.json*

to **Manifest URL** field in the bottom of "Install Module" window and press **"Install"**.
Congrats, you did it!

## User experience
![User experience illustration](/artwork/repo/user-experience.webp)

## GM experience
After you have finished the setup, it's basically the same.

But as a GM:
* You can choose a separate folder for your files.
* You can keep the original names.
* And if you choose to do so, a pop-up window will appear when you paste something from the clipboard, allowing you to edit a resulting name.
* You can limit the maximum image resolution per side. The image will be downscaled proportionally.
