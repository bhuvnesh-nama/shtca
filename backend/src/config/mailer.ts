import nodemailer from 'nodemailer';
import hbs from 'nodemailer-express-handlebars';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: 465,
    secure: true,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });

// Setup Handlebars with templates/emails
transporter.use(
  "compile",
  hbs({
    viewEngine: {
      extname: ".hbs",
      partialsDir: path.resolve(__dirname, "../src/templates/emails"),
      layoutsDir: path.resolve(__dirname, "../src/templates/emails"),
      defaultLayout: false,
    },
    viewPath: path.resolve(__dirname, "../src/templates/emails"),
    extName: ".hbs",
  })
);



// Send mail
function sendMail( emailTo:string, subject:string, template:string, context={}) {

  let mailOptions = {
        from: process.env.EMAIL_ADDRESS,
        to: emailTo,
        subject,
        template,
        context
    }
  transporter.sendMail(mailOptions)
}

export default sendMail;