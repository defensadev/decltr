import chalk from "chalk";

const logger = (protocol: string, msg: string) => {
  const time = new Date().toISOString();

  console.log(
    `${chalk.blue(protocol)} - ${chalk.green(msg)} - ${chalk.magenta(time)}`
  );
};

export default logger;
