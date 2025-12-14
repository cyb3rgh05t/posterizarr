## Manual Assets Naming

!!! important
    Naming must follow these rules, including proper case sensitivity (uppercase and lowercase) in file/folder names; otherwise, the asset will not be picked up.

If you have Library Folders set to `true`, it will look like this:

| **Asset** | **Naming** |
|----------------------------------|--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| **Poster** | `poster.*`|
| **Season** | `Season01.*`<br>`Season02.*`<br>`.....`|
| **Season Special** | `Season00.*`|
| **TitleCard** | `S01E01.*`<br>`S01E02.*`<br>`.....`|
| **Background** | `background.*`|

```
├───Anime Shows
│   └───Solo Leveling (2024) [tvdb-389597]
│           poster.jpg
│           S01E01.jpg
│           Season01.jpg
│           background.jpg
```

If you have Library Folders set to `false`, it will look like this:

| **Asset** | **Naming** |
|----------------------------------|--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| **Poster** | `Solo Leveling (2024) [tvdb-389597].*`|
| **Season** | `Solo Leveling (2024) [tvdb-389597]_Season01.*`<br>`Solo Leveling (2024) [tvdb-389597]_Season02.*`<br>`.....`|
| **Season Special** | `Solo Leveling (2024) [tvdb-389597]_Season00.*`|
| **TitleCard** | `Solo Leveling (2024) [tvdb-389597]_S01E01.*`<br>`Solo Leveling (2024) [tvdb-389597]_S01E02.*`<br>`.....`|
| **Background** | `Solo Leveling (2024) [tvdb-389597]_background.*`|

```
├───Anime Shows
│       Solo Leveling (2024) [tvdb-389597].jpg
│       Solo Leveling (2024) [tvdb-389597]_S01E01.jpg
│       Solo Leveling (2024) [tvdb-389597]_Season01.jpg
│       Solo Leveling (2024) [tvdb-389597]_background.jpg
```