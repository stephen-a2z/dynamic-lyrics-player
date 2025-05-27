# Dynamic Lyrics Player

A modern React application that visualizes lyrics dynamically with audio playback. This project features a sleek interface, real-time audio analysis, and engaging lyric animations, including a bullet screen (danmaku) mode.

## ✨ Features

-   **Dynamic Lyric Display**: Synchronized lyrics that highlight with the audio.
-   **Audio Visualization**: Visual effects that react to the music's frequency and intensity.
-   **Bullet Screen Mode (Danmaku)**: Lyrics fly across the screen in an engaging, interactive way.
-   **Custom File Upload**: Users can upload their own music and LRC lyric files.
-   **Playlist Management**: Supports default and user-uploaded playlists.
-   **Modern Tech Stack**: Built with React 18, Vite, TailwindCSS for a fast and responsive experience.

## 🚀 Getting Started

### Prerequisites

-   Node.js (v16 or later recommended)
-   pnpm (or npm/yarn)

### Installation

1.  Clone the repository:
    ```bash
    git clone https://github.com/stephen-a2z/dynamic-lyrics-player.git
    cd dynamic-lyrics-player
    ```
2.  Install dependencies:
    ```bash
    pnpm install
    ```

### Running the Application

```bash
pnpm run dev
```

This will start the development server, typically at `http://localhost:5173`.

## 🛠️ Available Scripts

-   `pnpm install`: Install project dependencies.
-   `pnpm run dev`: Start the development server.
-   `pnpm run build`: Build the application for production.
-   `pnpm run lint`: Lint source files using ESLint.
-   `pnpm run preview`: Preview the production build locally.

## 项目结构

```
├── public/              # 静态资源 (例如：默认播放列表、音频、歌词文件)
│   ├── data/
│   │   └── example.json # 示例数据 (如果需要)
│   └── example/         # 示例音乐和歌词文件夹
│       ├── lyrics/
│       ├── music/
│       └── playlist.json
├── src/
│   ├── App.jsx          # 主应用组件
│   ├── main.jsx         # 应用入口点
│   ├── index.css        # 全局样式 (Tailwind)
│   ├── components/      # React 组件
│   │   ├── AudioVisualizer.jsx
│   │   ├── BulletScreenMode.jsx
│   │   ├── FileUploader.jsx
│   │   ├── LyricsDisplay.jsx
│   │   └── MusicPlayer.jsx
│   ├── context/
│   │   └── PlayerContext.jsx # 播放器状态管理
│   └── utils/           # 工具函数
│       ├── audioAnalyzer.js
│       └── lyricsParser.js
├── .github/
│   └── workflows/
│       └── deploy.yml   # GitHub Actions 部署配置
├── index.html           # HTML 模板
├── vite.config.js       # Vite 配置
├── tailwind.config.js   # Tailwind CSS 配置
├── postcss.config.js    # PostCSS 配置
└── eslint.config.js     # ESLint 配置
```

## 💻 Tech Stack

-   React 18
-   Vite
-   TailwindCSS
-   ESLint
-   JavaScript (ES6+)

## 🤝 Contributing

Contributions are welcome! If you have suggestions for improvements or new features, feel free to open an issue or submit a pull request.

1.  Fork the Project
2.  Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3.  Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4.  Push to the Branch (`git push origin feature/AmazingFeature`)
5.  Open a Pull Request

## 📄 License

This project is licensed under the MIT License. See the [LICENSE](LICENSE.md) file for details.

---

_This README was generated with assistance from an AI coding partner._
