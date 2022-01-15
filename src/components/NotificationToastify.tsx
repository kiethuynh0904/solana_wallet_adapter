import React from "react";
import { ToastContainer, toast } from "react-toastify";
import LaunchIcon from "@material-ui/icons/Launch";
import { Link, makeStyles } from "@material-ui/core";
import { TransactionSignature } from "@solana/web3.js";

interface Props {
  message: String;
  signature?: TransactionSignature;
}

const useStyles = makeStyles({
  notification: {
    display: "flex",
    alignItems: "center",
    fontSize: 14,
  },
  link: {
    color: "#ffffff",
    marginLeft: 20,
    display: "flex",
    alignItems: "center",
    textDecoration: "underline",
    fontSize: 14,
    "&:hover": {
      color: "#777777",
    },
  },
  icon: {
    fontSize: 20,
    marginLeft: 8,
  },
});

const NotificationToastify: React.FC<Props> = (props) => {
  const styles = useStyles();

  return (
    <>
      <span className={styles.notification}>
        {props.message}
        {props.signature && (
          <Link
            className={styles.link}
            href={`https://explorer.solana.com/tx/${props.signature}?cluster=devnet`}
            target="_blank"
          >
            Transaction
            <LaunchIcon className={styles.icon} />
          </Link>
        )}
      </span>
    </>
  );
};

export default NotificationToastify;
