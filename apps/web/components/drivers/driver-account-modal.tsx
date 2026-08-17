"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import {
  AccessDeliveryPanel,
  type AccessDelivery,
} from "@/src/shared/components/access-delivery-panel";
import { useProvisionDriverAccess } from "@/hooks/use-users";
import { useToast } from "@/providers/toast-provider";
import { extractErrorMessage } from "@/services/http";
import type { Driver } from "@/types/driver";

type DriverAccountModalProps = {
  driver: Driver | null;
  onClose: () => void;
};

/**
 * Ativa o login de um motorista operacional já existente. O telefone é o
 * identificador e a API gera um código mostrado apenas nesta confirmação.
 */
export function DriverAccountModal({
  driver,
  onClose,
}: DriverAccountModalProps) {
  const { toast } = useToast();
  const provisionAccess = useProvisionDriverAccess();
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [createdAccess, setCreatedAccess] = useState<AccessDelivery | null>(
    null,
  );

  useEffect(() => {
    if (!driver) return;
    // O motorista selecionado muda a origem dos dados do formulário.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPhone(driver.phone ?? "");
    setEmail(driver.email ?? "");
    setFormError(null);
    setCreatedAccess(null);
  }, [driver]);

  async function activateAccess() {
    if (!driver) return;
    const normalizedPhone = phone.trim();
    if (!normalizedPhone) {
      setFormError("Enter the phone number the driver will use to sign in.");
      return;
    }

    setFormError(null);
    try {
      const result = await provisionAccess.mutateAsync({
        driverId: driver.id,
        phone: normalizedPhone,
        email: email.trim() || undefined,
      });

      setCreatedAccess({
        recipientName: driver.fullName,
        email: result.phone ?? normalizedPhone,
        identifierLabel: "Phone",
        password: result.accessCode,
        secretLabel: "Access code",
        changeableSecret: false,
        destinationUrl:
          process.env.NEXT_PUBLIC_DRIVER_APP_URL?.trim() ||
          "https://play.google.com/store/apps",
        destinationLabel: "Driver app (Play Store)",
        documentTitle: "Driver access details",
      });
      toast({
        title: "Mobile access activated",
        description: "Send the phone number and access code to the driver.",
        type: "success",
      });
    } catch (error) {
      setFormError(extractErrorMessage(error));
    }
  }

  return (
    <Modal
      open={driver !== null}
      size="lg"
      title="Mobile Access Account"
      description={
        driver ? `Activate app access for “${driver.fullName}”.` : undefined
      }
      onClose={onClose}
    >
      {createdAccess ? (
        <div className="flex flex-col gap-4">
          <AccessDeliveryPanel access={createdAccess} />
          <div className="flex justify-end">
            <Button onClick={onClose}>Done</Button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <div className="rounded-md border border-brand-100 bg-brand-50 px-4 py-3 text-sm text-brand-800 dark:border-brand-900 dark:bg-brand-950/30 dark:text-brand-200">
            The driver will sign in with a phone number and a system-generated code.
            The account will be linked to the existing operational record.
          </div>

          <Input
            id="driver-access-phone"
            label="Sign-in phone number *"
            type="tel"
            value={phone}
            placeholder="+258 84 123 4567"
            onChange={(event) => setPhone(event.target.value)}
          />
          <Input
            id="driver-access-email"
            label="Email (optional)"
            type="email"
            value={email}
            placeholder="driver@example.com"
            onChange={(event) => setEmail(event.target.value)}
          />

          <p className="text-xs text-slate-500 dark:text-slate-400">
            Once activated, the code is shown only once and can be shared by
            WhatsApp or as a PDF with a QR code.
          </p>

          {formError ? (
            <p className="rounded-md bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:bg-rose-950/30 dark:text-rose-300">
              {formError}
            </p>
          ) : null}

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              onClick={() => void activateAccess()}
              loading={provisionAccess.isPending}
            >
              Generate and activate access
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
}
