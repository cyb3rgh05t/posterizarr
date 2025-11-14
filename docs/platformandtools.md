## Docker

- [Docker-Compose Example File](https://github.com/fscorrupt/posterizarr/blob/main/docker-compose.yml)

  - Change `RUN_TIME` in yaml to your needs **- You need to use 24H Time Format**
    - The Script gets executed on the Times you specified
    - Before starting the scheduled run it checks if another Posterizarr process is running, if yes - the scheduled run will be skipped.
    - If set to `disabled`, the script will **not** run on a schedule but will still watch for file triggers and respond to manual triggers.
      - Required at `disabled` for the UI & if you want to set the schedules there.
  - Change `volume` and `network` to fit your environment (Make sure you have the same network as your plex container when you use local IP of plex)
  - Change `TimeZone` to yours, otherwise it will get scheduled to a different time you may want it to.
  - Add `DISABLE_UI` and set it to `true` if you want to disable the UI.
  - Change `APP_PORT` and set it to your prefered port (`9000` also update it in compose ports block)
  - You may also have to change `user: "1000:1000"` (PUID/PGID)

  If you manually want to run the Script you can do it this way:

  **Automatic Mode:**

  ```sh
  docker exec -it posterizarr pwsh /app/Posterizarr.ps1
  ```

  **Testing Mode:**

  ```sh
  docker exec -it posterizarr pwsh /app/Posterizarr.ps1 -Testing
  ```

  **Manual Mode (Interactive):**

  ```sh
  docker exec -it posterizarr pwsh /app/Posterizarr.ps1 -Manual
  ```

  **Backup Mode:**

  ```sh
  docker exec -it posterizarr pwsh /app/Posterizarr.ps1 -Backup
  ```

  **SyncJelly Mode:**

  ```sh
  docker exec -it posterizarr pwsh /app/Posterizarr.ps1 -SyncJelly
  ```

  **SyncEmby Mode:**

  ```sh
  docker exec -it posterizarr pwsh /app/Posterizarr.ps1 -SyncEmby
  ```

  **Poster reset Mode:**

  ```sh
  docker exec -it posterizarr pwsh /app/Posterizarr.ps1 -PosterReset -LibraryToReset "Test Lib"
  ```

!!! tip
    If you did not used `pwsh` on docker exec you can do it this way.

    Inside your `Unraid` or `Bash` or `Sh` console:

    ```sh
    pwsh /app/Posterizarr.ps1
    pwsh /app/Posterizarr.ps1 -Manual
    pwsh /app/Posterizarr.ps1 -Testing
    pwsh /app/Posterizarr.ps1 -Backup
    pwsh /app/Posterizarr.ps1 -SyncEmby
    pwsh /app/Posterizarr.ps1 -SyncJelly
    pwsh /app/Posterizarr.ps1 -PosterReset -LibraryToReset "Test Lib"
    ```

## unRAID

!!! tip
    If you are an unRAID user, just use the Community app from [@nwithan8](https://github.com/nwithan8) it is listed in Store.

    - Change `RUN_TIME` to your needs **- You need to use 24H Time Format**
        - Example: `06:00` or `06:00,14:00`.....
    - AssetPath in config needs to be `/assets` not the path you entered.

## Jellyfin
In order to view the `16:9` episode posters without getting cropped to `3:2`, you need to set a css.

```css
#itemDetailPage .listItemImage-large {
  width: 16vw;
  height: 9vw;
}
```

### CSS Client side How-To

![Jellyfin CSS](images/jellyfin_css.png)

### CSS Server wide How-To
![Jellyfin CSS](images/jellyfin-css-server.png)