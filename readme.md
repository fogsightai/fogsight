# Fogsight (雾象) [**English**](./readme_en.md) | [**中文**](./readme.md)


<p align="center">
  <img src="https://github.com/hamutama/caimaopics/raw/main/fogsight/logos/fogsight_logo_white_bg.png"
       alt="Fogsight Logo"
       width="300">
</p>

**雾象是一款由大型语言模型（LLM）驱动的动画引擎 agent 。用户输入抽象概念或词语，雾象会将其转化为高水平的生动动画。**

将雾象部署在本地后，您只需输入词语，点击生成，便可得到动画。


<p align="center">
  <img src="https://github.com/hamutama/caimaopics/raw/main/fogsight/1.png"
       alt="UI 截图"
       width="550">
</p>

我们设计了易用的语言用户界面（Language User Interface），用户也可以**进一步轻松编辑或改进生成动画，做到言出法随**。

雾象，意为 **“在模糊智能中的具象”**。*雾象是 WaytoAGI 开源计划项目成员。 WaytoAGI， 让更多人因 AI 而强大*


## 动画示例

以下为 Fogsight AI 生成的动画示例，点击以跳转并查看


<table>
  <tr>
    <td align="center">
      <a href="https://www.bilibili.com/video/BV1PXgKzBEyN">
        <img src="https://github.com/hamutama/caimaopics/raw/main/fogsight/thumbnails/entropy_increase_thumbnail.png" width="350"><br>
        <strong>The Law of Increasing Entropy (Physics)</strong><br>
        <strong>熵增定律 (物理学)</strong><br>
        <em>输入: 熵增定律</em>
      </a>
    </td>
    <td align="center">
      <a href="https://www.bilibili.com/video/BV1yXgKzqE42">
        <img src="https://github.com/hamutama/caimaopics/raw/main/fogsight/thumbnails/euler_formula_thumbnail.png" width="350"><br>
        <strong>Euler's Polyhedron Formula (Mathematics)</strong><br>
        <strong>欧拉多面体定理 (数学)</strong><br>
        <em>输入: 欧拉定理</em>
      </a>
    </td>
  </tr>
  <tr>
    <td align="center">
      <a href="https://www.bilibili.com/video/BV1sQgKzMEox">
        <img src="https://github.com/hamutama/caimaopics/raw/main/fogsight/thumbnails/bubble_sort_thumbnail.png" width="350"><br>
        <strong>Bubble Sort (Computer Science)</strong><br>
        <strong>冒泡排序 (计算机科学)</strong><br>
        <em>输入: 冒泡排序</em>
      </a>
    </td>
    <td align="center">
      <a href="https://www.bilibili.com/video/BV1yQgKzMEo6">
        <img src="https://github.com/hamutama/caimaopics/raw/main/fogsight/thumbnails/affordance_thumbnail.png" width="350"><br>
        <strong>Affordance (Design)</strong><br>
        <strong>可供性 (设计学)</strong><br>
        <em>输入: affordance in design</em>
      </a>
    </td>
  </tr>
</table>

## 核心功能

* **概念即影像**: 输入一个主题，Fogsight 将为您生成一部叙事完整的高水平动画，包含双语旁白与电影级的视觉质感。  
* **智能编排**: Fogsight 的核心是其强大的LLM驱动的编排能力。从旁白、视觉元素到动态效果，AI 将自动完成整个创作流程，一气呵成。  
* **语言用户界面 (LUI)**: 通过与 AI 的多轮对话，您可以对动画进行精准调优和迭代，直至达到您心中最理想的艺术效果。  

## 快速上手

### 环境要求

* Python 3.9+  
* 一个现代网络浏览器 (如 Chrome, Firefox, Edge)  
* 大语言模型的 API 密钥。我们推荐您使用 Google Gemini 2.5。  

### 安装与运行

1. **克隆代码仓库:**
   ```bash
   git clone https://github.com/fogsightai/fogsight.git
   cd fogsight
   ```

2. **安装依赖:**

   ```bash
   pip install -r requirements.txt
   ```

3. **配置API密钥:**

   ```bash
   cp demo-credentials.json credentials.json
   # 复制 demo-credentials.json 文件并重命名为 credentials.json
   # 编辑 credentials.json 文件，填入您的 API_KEY 和 BASE_URL。
   # **请注意**，我们使用的是与 OpenAI 兼容的 SDK，但您仍应使用Gemini 2.5 pro
   ```

4. **一键启动:**

   ```bash
   python start_fogsight.py
   # 运行 start_fogsight.py 脚本
   # 它将自动启动后端服务并在浏览器中自动打开 http://127.0.0.1:8000
   ```

5. **开始创作！**
   在页面中输入一个主题（例如"冒泡排序"），然后等待结果生成。

### Docker 方式运行

如果您更喜欢使用 Docker，可以按照以下步骤：

1. **确保 Docker 已安装:**
   请确保您的系统已安装 Docker 和 docker-compose。

2. **克隆代码仓库:**
   ```bash
   git clone https://github.com/fogsightai/fogsight.git
   cd fogsight
   ```

3. **配置API密钥:**
   ```bash
   cp demo-credentials.json credentials.json
   # 编辑 credentials.json 文件，填入您的 API_KEY、BASE_URL 和 MODEL
   
   # 使用 OpenRouter 的配置示例：
   # {
   #   "API_KEY": "sk-or-v1-您的OpenRouter密钥",
   #   "BASE_URL": "https://openrouter.ai/api/v1",
   #   "MODEL": "anthropic/claude-sonnet-4"
   # }
   
   # 使用 Gemini 的配置示例：
   # {
   #   "API_KEY": "您的Gemini密钥",
   #   "BASE_URL": "",
   #   "MODEL": "gemini-2.5-pro"
   # }
   ```

4. **使用 Docker Compose 启动:**
   ```bash
   # 使用默认端口 8000
   docker-compose up -d
   
   # 或者指定自定义端口（例如 3000）
   HOST_PORT=3000 docker-compose up -d
   ```
   
   如果 Docker 镜像无法拉取，可以尝试使用代理，或者使用镜像的国内源。

5. **访问应用:**
   打开浏览器访问 `http://localhost:8000`（或您指定的端口）

6. **停止服务:**
   ```bash
   docker-compose down
   ```

## OpenRouter 支持

Fogsight 完全支持 OpenRouter，让您可以使用各种优秀的大语言模型：

### 支持的模型示例：
- **Anthropic Claude**: `anthropic/claude-3-sonnet-20240229`, `anthropic/claude-3-opus-20240229`
- **OpenAI GPT**: `openai/gpt-4-turbo`, `openai/gpt-3.5-turbo`
- **Google Gemini**: `google/gemini-pro-1.5`, `google/gemini-pro`
- **Meta Llama**: `meta-llama/llama-3-70b-instruct`
- **其他模型**: 访问 [OpenRouter Models](https://openrouter.ai/models) 查看完整列表

### 配置方法：
1. 在 [OpenRouter](https://openrouter.ai/) 注册并获取 API 密钥
2. 编辑 `credentials.json`:
   ```json
   {
     "API_KEY": "sk-or-v1-你的OpenRouter密钥",
     "BASE_URL": "https://openrouter.ai/api/v1",
     "MODEL": "anthropic/claude-3-sonnet-20240229"
   }
   ```
3. 启动应用即可使用指定的模型

### 优势：
- 🌟 **多模型选择**: 一个接口访问多种顶级模型
- 💰 **价格透明**: 通常比官方 API 更有竞争力
- 🚀 **无缝切换**: 只需修改配置文件中的 MODEL 字段

## 联系我们/加入群聊

请访问[此链接](https://fogsightai.feishu.cn/wiki/WvODwyUr1iSAe0kEyKfcpqvynGc?from=from_copylink)联系我们或加入交流群。

## Contributors

### 高校

* [@taited](https://taited.github.io/) - 香港中文大学（深圳） 博士生
* [@yjydya](https://github.com/ydyjya) - 南洋理工大学 博士生

### WaytoAGI 社区

* [@richkatchen 陈财猫](https://okjk.co/enodyA) - WaytoAGI 社区成员
* [@kk](https://okjk.co/zC8myE) - WaytoAGI 社区成员

### Index Future Lab

* [何淋 (@Lin he)](https://github.com/zerohe2001)

### AI 探索家

* [黄小刀 (@Xiaodao Huang)](https://okjk.co/CkFav6)

### 独立开发者与 AI 艺术家

* [@shuyan-5200](https://github.com/shuyan-5200)
* [王如玥 (@Ruyue Wang)](https://github.com/Moonywang)
* [@Jack-the-Builder](https://github.com/Jack-the-Builder)
* [@xiayurain95](https://github.com/xiayurain95)
* [@Lixin Cai 蔡李鑫](https://github.com/Lixin-Cai)

## 开源许可

本项目基于 MIT 许可证开源。
不过，如果您愿意在引用本项目时加上我们的署名与指向本项目的链接，我们会非常感谢 😊。
