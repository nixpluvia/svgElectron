const { ipcMain, dialog } = require("electron");
const path = require("path");
const { optimize } = require("svgo");
const fs = require("fs");

module.exports = function () {
	/**
	 * 폰트 저장을 위한 SVG 아이콘 최적화 함수
	 * @param {*} data
	 * @returns
	 */
	async function generateVariable(data) {
		// 아이콘 저장할 폴더 선택
		const dialogResult = await dialog.showOpenDialog({
			properties: ["openDirectory"],
		});

		const iconsData = data.icons;
		const fontPrefix = data.projectInfo.fontPrefix || '';
		if (!Array.isArray(iconsData) || iconsData.length === 0) {
			console.error("아이콘 데이터가 비어있거나 잘못된 형식입니다.");
			return null;
		}
		if (dialogResult.canceled || !dialogResult.filePaths || dialogResult.filePaths.length === 0) {
			return null;
		} else {
			const folderPath = dialogResult.filePaths[0];

			// 폴더 경로 선택됨
			if (!fs.existsSync(folderPath)) {
				fs.mkdirSync(folderPath, { recursive: true });
			}

			let newCss = ":root {\n";
			const prefix = fontPrefix !== '' ? `--i-${fontPrefix}-` : '--i-';
			for (const icon of iconsData) {
				if (icon.data && icon.data.trim() !== "") {
					try {
						// 최적화
						const result = optimize(icon.data, {
							multipass: true,
						});

						// 결과 파일로 저장
						icon.data = result.data; // 최적화된 데이터로 업데이트
						icon.updated = new Date().toISOString().replace("T", " ").substring(0, 19);

						const base64Data = `url('data:image/svg+xml;base64,${Buffer.from(result.data).toString('base64')}')`;
						newCss += `${prefix}${icon.name} : ${base64Data};\n`;


					} catch (err) {
						console.error(`Error optimizing icon ${icon.name}:`, err);
					}
				}
			}
			newCss += "}\n";
			// CSS 파일 생성
			const copyPath = path.join(folderPath, "icons.css");
			fs.writeFileSync(copyPath, newCss, "utf8");

			return folderPath || null; // 폴더 경로 반환
		}
	}

	/**
	 * SVG 폰트 생성 요청 수신
	 * @param {*} event
	 * @param {*} svgInfo
	 */
	ipcMain.on("generate-variable", async (event, data) => {
		try {
			const folderPath = await generateVariable(data);
			if (!folderPath) {
				event.reply("generate-variable-done", "폴더 선택이 취소되었습니다.");
				return;
			}
			event.reply("generate-variable-done", {
				path: folderPath, // 폴더 경로
				data: "success", // SVG 아이콘 정보가 담긴 객체
			});
		} catch (err) {
			console.error("폰트 생성 실패:", err);
			event.reply("generate-variable-done", "실패!");
		}
	});
};