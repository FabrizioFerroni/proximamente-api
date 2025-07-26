import chalk from "chalk";
import { formatDateHour } from "../utils/formatDate";

export const Logger = {
  log: (message: string, serviceName: string = "InstanceLoader") => {
    console.log(
      `${chalk.green(`[NODE] ${process.pid} -`)} ${formatDateHour(
        new Date()
      )} ${chalk.green("LOG")} ${chalk.yellow(
        `[${serviceName}]`
      )} ${chalk.green(`${message}`)}`
    );
  },
  error: (message: string, serviceName: string = "InstanceLoader") => {
    console.error(
      `${chalk.red(`[NODE] ${process.pid} -`)} ${formatDateHour(
        new Date()
      )} ${chalk.red("ERROR")} ${chalk.yellow(`[${serviceName}]`)} ${chalk.red(
        `${message}`
      )}`
    );
  },
  warn: (message: string, serviceName: string = "InstanceLoader") => {
    console.warn(
      `${chalk.yellow(`[NODE] ${process.pid} -`)} ${formatDateHour(
        new Date()
      )} ${chalk.yellow("WARN")} ${chalk.yellow(
        `[${serviceName}]`
      )} ${chalk.yellow(`${message}`)}`
    );
  },
};
