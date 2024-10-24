import axios from "axios";
import colors from "colors";
import inquirer from "inquirer";
import fileHelper from "../helpers/file.js";
import gameService from "./game.js";
import server from "./server.js";

class KeyService {
  constructor() {}

  maskApiKey(apiKey) {
    // Tách chuỗi thành 3 phần: phần đầu, phần giữa cần ẩn, và phần cuối
    const parts = apiKey.split("_");
    if (parts.length !== 2) {
      throw new Error("Invalid API key format");
    }

    const prefix = parts[0]; // 'pro'
    const key = parts[1]; // 'a8ff5ce14b57853563c44988a890dca2'

    // Lấy phần đầu của key (6 ký tự) và phần cuối của key (4 ký tự)
    const start = key.slice(0, 6);
    const end = key.slice(-6);

    // Phần giữa sẽ được thay thế bằng các ký tự '*'
    const maskedMiddle = "*".repeat(key.length - start.length - end.length);

    // Kết hợp lại chuỗi đã được ẩn
    return `${prefix}_${start}${maskedMiddle}${end}`;
  }

  async checkKey(database, apiKey) {
    try {
      const URL = database?.server?.pro[0].url;
      const endpoint = `${URL}blum/check-limit`;

      const { data } = await axios.get(endpoint, {
        headers: {
          "X-API-KEY": apiKey,
        },
      });
      return data;
    } catch (error) {
      // console.log(
      //   colors.red(
      //     `[${error?.response?.data?.code}] ` +
      //       error?.response?.data?.message
      //   )
      // );
      return null;
    }
  }

  async handleApiKey() {
    const database = await server.getData();

    const rawKeys = fileHelper.readFile("key.txt");
    const keys = rawKeys
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.length > 0);

    if (keys.length) {
      const apiKey = keys[0];

      const check = await this.checkKey(database, apiKey);
      if (check === null) {
        console.log(
          colors.red(
            `API KEY không hợp lệ, liên hệ Telegram @zuydd để nhận/mua API KEY`
          )
        );
      } else {
        gameService.setApiKey(apiKey);
        gameService.setQuota(check?.data);
        const maskedKey = this.maskApiKey(apiKey);
        console.log(
          `API KEY: ${colors.green(maskedKey)} - Còn ${colors.green(
            check?.data
          )} lượt sử dụng`
        );
      }
    } else {
      const response = await inquirer.prompt([
        {
          type: "input",
          name: "apiKey",
          message:
            "Nhập API KEY chơi game của bạn? Để trống nếu bạn không có (sẽ bỏ qua chơi game trong quá trình chạy tool)",
        },
      ]);
      const { apiKey } = response;
      if (apiKey) {
        const check = await this.checkKey(database, apiKey);
        if (check === null) {
          console.log(
            colors.red(
              `API KEY không hợp lệ, liên hệ Telegram @zuydd để nhận/mua API KEY`
            )
          );
        } else {
          fileHelper.writeLog("key.txt", apiKey);
          gameService.setApiKey(apiKey);
          gameService.setQuota(check?.data);
          const maskedKey = this.maskApiKey(apiKey);
          console.log(
            `API KEY: ${colors.green(maskedKey)} - Còn ${colors.green(
              check?.data
            )} lượt sử dụng`
          );
        }
      }
    }
  }
}

const keyService = new KeyService();
export default keyService;
