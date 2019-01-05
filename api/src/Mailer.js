const nodemailer = require("nodemailer");
const EventEmitter = require("events");

/**
 * Mailer service
 */
class Mailer extends EventEmitter {
  constructor(config) {
    super();

    this.config = config;

    if (this.config.emailServer) {
      let config = {
        host: this.config.emailServer,
        port: this.config.emailPort,
        secure: this.config.emailSsl,
        tls: {
          rejectUnauthorized: false // do not fail on invalid certs
        }
      };
      if (this.config.emailUsername && this.config.emailPassword) {
        config.auth = {
          type: "login",
          user: this.config.emailUsername,
          pass: this.config.emailPassword
        };
      }
      this.transport = nodemailer.createTransport(config);
    } else {
      this.transport = nodemailer.createTransport({
        sendmail: true,
        newline: "unix",
        path: "sendmail"
      });
    }
  }

  // eslint-disable-next-line lodash/prefer-constant
  static get $provides() {
    return "mailer";
  }

  // eslint-disable-next-line lodash/prefer-constant
  static get $requires() {
    return ["config"];
  }

  // eslint-disable-next-line lodash/prefer-constant
  static get $lifecycle() {
    return "singleton";
  }

  /**
   * Check the transport is working
   */
  async init() {
    if (this.promise) return this.promise;

    this.promise = new Promise((resolve, reject) => {
      if (!this.config.emailServer) return resolve();

      this.transport.verify((error, success) => {
        if (error || !success) return reject(error);

        resolve();
      });
    });
    return this.promise;
  }

  /**
   * Send mail
   */
  async send(to, from, subject, text, html) {
    return new Promise((resolve, reject) => {
      this.transport.sendMail({ to, from, subject, text, html }, error => {
        if (error) return reject(error);

        if (process.env.NODE_ENV === "development")
          console.log(`> Sent mail for ${to}`);

        resolve();
      });
    });
  }
}

module.exports = Mailer;